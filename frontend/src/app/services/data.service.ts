import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const DEV_URL = "http://127.0.0.1:8000";
const API_URL = "https://api.nativeware.dev";

export interface SearchResult {
    title: string;
    excerpt: string;
    excerpt_subtitle: string;
    location: string;
    type: string;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    total: number;
}

export interface AsrResponse {
    filename: string;
    content_type: string;
    transcript: string;
}

@Injectable({
    providedIn: 'root'
})

export class DataService {
    private http = inject(HttpClient);
    // get the NODE_ENV variable
    private readonly nodeEnv = process.env['NODE_ENV'];
    private apiUrl: string;

    constructor() {
        if (this.nodeEnv === 'development') {
            this.apiUrl = DEV_URL;
        } else {
            this.apiUrl = API_URL;
        }
    }

    search(query: string): Observable<SearchResponse> {
        console.log('response from ' + this.apiUrl);
        return this.http.get<SearchResponse>(`${this.apiUrl}/search/`, {
            params: { query: query }
        });
    }

    getEntry(id: string): Observable<SearchResult> {
        return this.http.get<SearchResult>(`${this.apiUrl}/entries/${id}`);
    }

    getSuggestions(partial: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/suggestions`, {
            params: { prefix: partial }
        });
    }

    transcribeAudio(audio: Blob, filename: string): Observable<AsrResponse> {
        const formData = new FormData();
        formData.append('audio_file', audio, filename);

        return this.http.post<AsrResponse>(`${this.apiUrl}/asr/`, formData);
    }
}
