from typing import Any
from datasets import load_dataset
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import torch
import librosa
from auditok import split
import ffmpeg
import os
import uuid

# model repo
BIG_MODEL = "./models/mms-1b"
SMALL_MODEL = "./models/mms-300m"
repo_name = SMALL_MODEL

def init_model(repo):
    model = Wav2Vec2ForCTC.from_pretrained(repo)
    processor = Wav2Vec2Processor.from_pretrained(repo, 
    low_cpu_mem_usage=True)
    processor.tokenizer.set_target_lang("mus")
    return model, processor


def transcribe_speech(audio_data: bytes, filename):

    # initialize
    tmp_dir = "./tmp"
    model, processor = init_model(repo_name)
    if not os.path.exists(tmp_dir):
        os.makedirs(tmp_dir)

    temp_file = str(uuid.uuid4()) + ".wav"
    temp_file = os.path.join(tmp_dir, temp_file)
    if not filename.endswith('.wav'):
        # write and convert to wav
        tmp_web_file = str(uuid.uuid4()) + "_" + filename
        tmp_web_file = os.path.join(tmp_dir, tmp_web_file)
        with open(tmp_web_file, "wb") as f:
            f.write(audio_data)
            convert_file(tmp_web_file, temp_file)
        os.remove(tmp_web_file)
    else:
        # if it is already a wav file, just save it as temp_audio.wav
        with open(temp_file, "wb") as f:
            f.write(audio_data)
    try:
        transcript = transcribe_long_audio(model, processor, temp_file)
    finally:
        # clean up temp file
        os.remove(temp_file)

    return transcript

def load_data(file):
    na_test = load_dataset('csv', data_files=[file], delimiter='\t')
    na_test = na_test['train']
    return na_test

def decode(model, processor, audio_array, sample_rate, lm_decoder=None):
    """
    decode and return predictions and logits
    for one data instance
    """
    input_dict = processor(audio_array, sampling_rate=sample_rate, return_tensors="pt", padding=True)

    with torch.no_grad():
        logits = model(**input_dict).logits

    # with language model
    if lm_decoder!=None:
        return lm_decoder.decode(logits.numpy()[0])
    else:
        # without language model
        pred_ids = torch.argmax(logits, dim=-1)[0]
        return processor.decode(pred_ids)

def transcribe_long_audio(model, processor, wav):
    outputs = []

    print('reading...')
    sample_rate = 16000
    signal, o_sr = librosa.load(wav, sr=sample_rate)

    dur = (len(signal)/o_sr)
    print('duration: '+str(dur))
        
    print('starting transcription...')
    # this will split using the original sample rate.
    # That's ok, our segmentation will still be at the designated sample_rate
    regions = split(wav, 
                    min_dur=0.2,
                    max_dur=5,
                    max_silence=0.4,
                    eth=55, # energy threshold
                    )
    
    for i, r in enumerate(regions):
        start_time = r.start or 0
        end_time = r.end or dur # type: ignore
        seg = signal[int(start_time*sample_rate):int(end_time*sample_rate)]
        preds = decode(model, processor, seg, sample_rate)
        outputs.append(preds)

    print(outputs)
    return outputs

def convert_file(file, dest_file=None):
    # convert to wav
    out_file = dest_file if dest_file else file.split('.')[0]+'.wav'
    ffmpeg.input(file).output(out_file).run()

    return out_file

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("wav", type=str, help="path to wav file")
    args = parser.parse_args()

    wav_file = args.wav
    # if it is not a wav file, convert it to wav first
    if not wav_file.endswith('.wav'):
        wav_file = convert_file(wav_file)

    model, processor = init_model(repo_name)
    transcribe_long_audio(model, processor, wav_file)
