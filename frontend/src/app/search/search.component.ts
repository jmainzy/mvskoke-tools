import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, SearchResult } from '../services/data.service';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchResultsComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly dataService = inject(DataService);
    private readonly cdr = inject(ChangeDetectorRef);

    searchTerm = '';
    results: SearchResult[] = [];
    groupedResults: { filename: string; title: string; type: string; matches: SearchResult[]; highlightParam: string }[] = [];
    isLoading = false;
    error: string | null = null;

    ngOnInit(): void {
        this.route.queryParamMap.subscribe((params) => {
            const query = params.get('query')?.trim() ?? '';
            this.searchTerm = query;
            if (query) {
                this.performSearch(query);
            } else {
                this.results = [];
                this.error = null;
            }
        });
    }

    onSearchSubmit(): void {
        if (this.searchTerm.trim()) {
            this.performSearch(this.searchTerm.trim());
        }
    }

    private performSearch(query: string): void {
        this.isLoading = true;
        this.error = null;
        this.dataService.search(query).subscribe({
            next: (response) => {
                this.results = response.results;
                this.groupedResults = this.groupByFilename(this.results);
                this.isLoading = false;
                this.cdr.detectChanges();
                console.log(`Search results for "${query}":`, this.results);
                console.log('response: received with ', this.results);
            },
            error: (err) => {
                console.error('Search error:', err);
                this.error = 'Failed to fetch search results. Please try again.';
                this.results = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    exampleSearchTerms = ['Mekusvpkv', 'semvnole', 'church', 'sofke'];

    private groupByFilename(results: SearchResult[]) {
        const map = new Map<string, { filename: string; title: string; type: string; matches: SearchResult[]; highlightParam: string }>();
        for (const r of results) {
            const filename = r.location || 'unknown';
            if (!map.has(filename)) {
                map.set(filename, {
                    filename,
                    title: r.title || this.cleanTitle(filename),
                    type: r.type || '',
                    matches: [r],
                    highlightParam: `${r.line}`
                });
            } else {
                const group = map.get(filename)!;
                group.matches.push(r);
                const lines = Array.from(new Set(group.matches.map(match => match.line))).sort((a, b) => a - b);
                group.highlightParam = lines.join(',');
            }
        }
        return Array.from(map.values());
    }

    private cleanTitle(filename: string): string {
        return filename.replace(/\.txt$/i, '').replace(/_/g, ' ');
    }

    get resultHeading(): string {
        return this.searchTerm ? `Results for "${this.searchTerm}"` : 'Search Results';
    }

}