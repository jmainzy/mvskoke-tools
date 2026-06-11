from fastapi import FastAPI, File, UploadFile, HTTPException
import os
from fastapi.middleware.cors import CORSMiddleware
from speech.asr import transcribe_speech
from models import SearchResult, SearchResponse
import search.core as search

app = FastAPI()

origins = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://mvskoke.netlify.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/search/")
async def perform_search(query: str):
    
    results = search.search(query)
    print(f'found {len(results)} results')

    return SearchResponse(
        query=query,
        results=results,
        total=len(results)
    )

@app.post("/asr/")
async def perform_asr(audio_file: UploadFile = File(...)):
    audio_data = await audio_file.read()
    # transcript = transcribe_speech(audio_data, audio_file.filename)

    return {
        "filename": audio_file.filename,
        "content_type": audio_file.content_type,
        "transcript": "ASR feature is currently unavailable. Please check back later.",
    }


@app.get("/files/{filename}")
async def get_file(filename: str):
    # Serve text file content from the data directory. Validate path to avoid directory traversal.
    data_dir = os.path.abspath("data")
    requested = os.path.abspath(os.path.join(data_dir, filename))
    if not requested.startswith(data_dir):
        raise HTTPException(status_code=400, detail="Invalid filename")
    if not os.path.exists(requested):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        with open(requested, "r", encoding="utf-8") as fh:
            content = fh.read()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read file")

    return {"filename": filename, "content": content}