import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService, ReadAlongItem } from '../services/data.service';

@Component({
    selector: 'app-read-along-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './read-along-detail.component.html',
    styleUrl: './read-along-detail.component.scss'
})
export class ReadAlongDetailComponent {
    item: ReadAlongItem | undefined;
    private readonly route = inject(ActivatedRoute);
    private readonly dataService = inject(DataService);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        if (id) {
            this.dataService.getReadAlong(id).subscribe(i => this.item = i);
        }
    }

    private svgDataUrl(text: string): string {
        const escaped = encodeURIComponent(text);
        return `data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='100%' height='100%' fill='%232563eb'/><text x='50%' y='50%' fill='%23fff' font-size='28' text-anchor='middle' dominant-baseline='middle'>${escaped}</text></svg>`;
    }
}
