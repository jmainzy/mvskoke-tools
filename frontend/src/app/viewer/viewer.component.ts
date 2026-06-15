import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
    selector: 'app-viewer',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './viewer.component.html',
    styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements OnInit, AfterViewInit {
    private readonly route = inject(ActivatedRoute);
    private readonly dataService = inject(DataService);

    @ViewChild('fileContentContainer') fileContentContainer?: ElementRef<HTMLDivElement>;

    filename = '';
    title = '';
    content = '';
    previousQuery = '';
    fileLines: { text: string; tag: string; highlight: boolean; lineIndex: number }[] = [];
    highlightLines: number[] = [];
    isLoading = false;
    error: string | null = null;

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            this.highlightLines = this.parseHighlightParams(params.get('hl'));
            this.previousQuery = params.get('query')?.trim() ?? '';
            if (this.content) {
                this.fileLines = this.parseFileLines(this.content);
                this.scrollToFirstHighlight();
            }
        });

        this.route.paramMap.subscribe(params => {
            const filename = params.get('filename');
            if (filename) {
                this.filename = filename;
                this.title = this.cleanTitle(filename);
                this.fetchFile(filename);
            }
        });
    }

    ngAfterViewInit(): void {
        this.scrollToFirstHighlight();
    }

    private fetchFile(filename: string): void {
        this.isLoading = true;
        this.error = null;
        this.dataService.getFileContent(filename).subscribe({
            next: (res) => {
                this.content = res.content;
                this.fileLines = this.parseFileLines(this.content);
                this.isLoading = false;
                setTimeout(() => this.scrollToFirstHighlight(), 100);
            },
            error: (err) => {
                console.error('Failed to load file:', err);
                this.error = 'Failed to load file content.';
                this.isLoading = false;
            }
        });
    }

    private parseFileLines(content: string) {
        const lines = content.split(/\r?\n/);
        const firstMusIndex = lines.findIndex((rawLine) => rawLine.startsWith('\\mus'));
        const headerLines = lines.slice(0, firstMusIndex >= 0 ? firstMusIndex : lines.length);

        const header = headerLines.map((rawLine, index) => ({
            text: (rawLine || '').replace(/§/g, ''),
            tag: 'header',
            highlight: this.highlightLines.includes(index),
            lineIndex: index
        }));

        const bodyLines = firstMusIndex >= 0 ? lines.slice(firstMusIndex) : [];
        const body = bodyLines
            .map((rawLine, index) => {
                const originalIndex = firstMusIndex + index;
                const [tagPart, ...rest] = rawLine.split('\t');
                const normalizedTag = tagPart?.trim();
                const text = rest.join('\t').trim().replace(/§/g, '');
                const tag = normalizedTag === '\\mus' ? 'mus'
                    : normalizedTag === '\\en' ? 'en'
                        : normalizedTag === '\\gls' ? 'gls'
                            : 'other';
                return {
                    text: text || '',
                    tag,
                    highlight: this.highlightLines.includes(originalIndex),
                    lineIndex: originalIndex
                };
            })
            .filter(line => line.tag !== 'gls');

        return [...header, ...body];
    }

    private parseHighlightParams(param: string | null): number[] {
        if (!param) {
            return [];
        }

        return param.split(',')
            .map(value => parseInt(value, 10))
            .filter(value => !Number.isNaN(value));
    }

    private cleanTitle(filename: string): string {
        return filename.replace(/\.txt$/i, '').replace(/_/g, ' ');
    }

    private scrollToFirstHighlight(): void {
        if (!this.fileContentContainer) {
            return;
        }
        const highlightedElement = this.fileContentContainer.nativeElement.querySelector('.highlight-line');
        if (highlightedElement) {
            highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}
