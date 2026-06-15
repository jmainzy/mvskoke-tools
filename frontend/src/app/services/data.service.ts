import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const DEV_URL = "http://127.0.0.1:8000";
const API_URL = "https://api.nativeware.dev";

export interface SearchResult {
    title: string;
    excerpt: string;
    excerpt_subtitle: string;
    location: string;
    line: number;
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

export interface FileResponse {
    filename: string;
    content: string;
}

export interface ReadAlongItem {
    id: string;
    title: string;
    subtitle?: string;
    preview: string;
    preview_en: string;
    img: string;
    source?: string;
}

@Injectable({
    providedIn: 'root'
})

export class DataService {
    private http = inject(HttpClient);
    private searchCache = new Map<string, SearchResponse>();
    // lightweight in-memory read-alongs list (used by frontend components)
    private readonly readAlongItems: ReadAlongItem[] = [
        {
            id: 'chipbear',
            title: 'Story of Day and Night',
            subtitle: 'Chimpunk and Bear',
            preview: 'Nere nettv onvkuce. Punvttv omvlkvt eto ofv fullat nvkaftvtēs...',
            preview_en: 'A night and day story. All the animals of the forest had a meeting...',
            img: 'read-alongs/chipbear.jpg',
        },
        {
            id: 'postoak-01',
            title: 'John R. Postoak letter to A. E. W. Robertson',
            subtitle: 'December 11, 1878',
            preview: 'Hiyomat vm opunvkv mahusan es cen coyet omis. Vm vnokeckv vm vhayv tate toyetskat...',
            preview_en: 'At this time I am writing you in my very own language. My beloved former teacher...',
            img: 'read-alongs/postoak-01.png',
            source: 'https://muskogee.pages.wm.edu/wp-content/blogs.dir/3050/files/sites/148/2016/12/mus06051.pdf',
        },
    ];

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
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return of({ query, results: [], total: 0 });
        }

        const cached = this.searchCache.get(normalizedQuery);
        if (cached) {
            return of(cached);
        }

        console.log('response from ' + this.apiUrl);
        return this.http.get<SearchResponse>(`${this.apiUrl}/search/`, {
            params: { query: query }
        }).pipe(
            tap({
                next: (response) => {
                    this.searchCache.set(normalizedQuery, response);
                }
            })
        );
    }

    getEntry(id: string): Observable<SearchResult> {
        return this.http.get<SearchResult>(`${this.apiUrl}/entries/${id}`);
    }

    getFileContent(filename: string): Observable<FileResponse> {
        // filename is expected to be the base filename like '1871_Creek_Second_Reader.txt'
        return this.http.get<FileResponse>(`${this.apiUrl}/files/${encodeURIComponent(filename)}`);
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

    // Read-alongs (frontend only) -------------------------------------------------
    getReadAlongs(): Observable<ReadAlongItem[]> {
        return of(this.readAlongItems.slice());
    }

    getReadAlong(id: string): Observable<ReadAlongItem | undefined> {
        const found = this.readAlongItems.find((it) => it.id === id);
        return of(found);
    }
}
