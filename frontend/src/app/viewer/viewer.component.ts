import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
    selector: 'app-viewer',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './viewer.component.html',
    styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly dataService = inject(DataService);

    filename = '';
    title = '';
    content = '';
    isLoading = false;
    error: string | null = null;

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const filename = params.get('filename');
            if (filename) {
                this.filename = filename;
                this.title = this.cleanTitle(filename);
                this.fetchFile(filename);
            }
        });
    }

    private fetchFile(filename: string): void {
        this.isLoading = true;
        this.error = null;
        this.dataService.getFileContent(filename).subscribe({
            next: (res) => {
                this.content = res.content;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load file:', err);
                this.error = 'Failed to load file content.';
                this.isLoading = false;
            }
        });
    }

    private cleanTitle(filename: string): string {
        return filename.replace(/\.txt$/i, '').replace(/_/g, ' ');
    }
}
