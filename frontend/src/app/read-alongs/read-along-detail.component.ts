import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface ReadAlongItem {
    id: string;
    title: string;
    subtitle?: string;
    preview: string;
    img: string;
    source: string;
}

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

    private items: ReadAlongItem[] = [
        {
            id: 'postoak-1',
            title: 'John R. Postoak letter to A. E. W. Robertson',
            subtitle: 'December 11, 1878',
            preview: 'Hiyomat vm opunvkv mahusan es cen coyet omis. Vm vnokeckv vm vhayv tate toyetskat...',
            img: 'read-alongs/postoak-01.png',
            source: 'https://muskogee.pages.wm.edu/wp-content/blogs.dir/3050/files/sites/148/2016/12/mus06051.pdf',
        },
    ];

    constructor(private route: ActivatedRoute) {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.item = this.items.find((it) => it.id === id);
    }

    private svgDataUrl(text: string): string {
        const escaped = encodeURIComponent(text);
        return `data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='100%' height='100%' fill='%232563eb'/><text x='50%' y='50%' fill='%23fff' font-size='28' text-anchor='middle' dominant-baseline='middle'>${escaped}</text></svg>`;
    }
}
