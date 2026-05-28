import { NgIf } from '@angular/common';
import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../services/data.service';

@Component({
    selector: 'app-speech-recognition',
    standalone: true,
    imports: [NgIf, RouterLink],
    templateUrl: './speech-recognition.component.html',
    styleUrl: './speech-recognition.component.scss'
})
export class SpeechRecognitionComponent implements OnDestroy {
    private readonly dataService = inject(DataService);
    private readonly ngZone = inject(NgZone);

    isRecording = false;
    isStarting = false;
    isSending = false;
    statusMessage = 'Press record to capture audio from your microphone.';
    isDraggingFile = false;
    selectedFileName: string | null = null;
    recognitionOutput = 'Press "Go" to output Mvskoke text from your audio.';
    previewAudioUrl: string | null = null;

    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private recordedAudioBlob: Blob | null = null;
    private stream: MediaStream | null = null;
    private selectedFile: File | null = null;

    async toggleRecording(): Promise<void> {
        if (this.isRecording) {
            this.stopRecording();
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            this.statusMessage = 'Recording is not supported in this browser.';
            return;
        }

        this.isStarting = true;
        this.statusMessage = 'Requesting microphone access...';

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(this.stream);

            this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.ngZone.run(() => {
                    const audioBlob = new Blob(this.recordedChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
                    this.recordedAudioBlob = audioBlob;
                    this.setPreviewAudio(audioBlob, 'recorded');
                    this.statusMessage = 'Recording saved. You can play it back below.';
                    this.cleanupStream();
                });
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.statusMessage = 'Recording... click stop when you are done.';
        } catch {
            this.statusMessage = 'Microphone access was denied or unavailable.';
            this.cleanupStream();
        } finally {
            this.isStarting = false;
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        this.setSelectedFile(file);
        input.value = '';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingFile = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingFile = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDraggingFile = false;

        const file = event.dataTransfer?.files?.[0] ?? null;
        this.setSelectedFile(file);
    }

    async sendToAsr(): Promise<void> {
        const audioSource = this.selectedFile ?? this.recordedAudioBlob;
        const filename = this.selectedFile?.name ?? 'recorded-audio.webm';

        if (!audioSource) {
            this.statusMessage = 'Choose a file or record audio before sending it to ASR.';
            return;
        }

        this.isSending = true;
        this.statusMessage = 'Sending audio to the ASR endpoint...';

        try {
            const response = await firstValueFrom(this.dataService.transcribeAudio(audioSource, filename));
            this.recognitionOutput = response
                ? `${response.transcript}`
                : 'No transcription was returned by the server.';
            this.statusMessage = 'Transcription complete.';
        } catch {
            this.statusMessage = 'Unable to process the audio with ASR right now.';
            this.recognitionOutput = 'ASR request failed. Check the backend service and try again.';
        } finally {
            this.isSending = false;
        }
    }

    stopRecording(): void {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            this.isRecording = false;
            this.cleanupStream();
            return;
        }

        this.mediaRecorder.stop();
        this.isRecording = false;
    }

    ngOnDestroy(): void {
        this.cleanupStream();
        this.clearPreviewAudio();
    }

    private cleanupStream(): void {
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
        this.mediaRecorder = null;
    }

    private setPreviewAudio(source: Blob, type: 'recorded' | 'file'): void {
        this.clearPreviewAudio();
        this.previewAudioUrl = URL.createObjectURL(source);
    }

    private clearPreviewAudio(): void {
        if (this.previewAudioUrl) {
            URL.revokeObjectURL(this.previewAudioUrl);
            this.previewAudioUrl = null;
        }
    }

    private setSelectedFile(file: File | null): void {
        if (!file) {
            this.selectedFile = null;
            this.selectedFileName = null;
            this.statusMessage = 'No audio file selected yet.';
            this.recognitionOutput = 'Press "Go" to output Mvskoke text from your audio.';
            this.clearPreviewAudio();
            return;
        }

        this.selectedFile = file;
        this.selectedFileName = file.name;
        this.statusMessage = `Selected ${file.name}. Ready for transcription.`;
        this.recognitionOutput = `Selected file: ${file.name}\nSize: ${Math.round(file.size / 1024)} KB\n\nPress "Go" to output Mvskoke text from your audio.`;
        this.setPreviewAudio(file, 'file');
    }
}
