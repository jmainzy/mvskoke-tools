from fastapi import FastAPI, File, UploadFile
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