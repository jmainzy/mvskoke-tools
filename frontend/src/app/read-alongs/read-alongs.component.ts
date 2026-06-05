import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ReadAlongItem {
    id: string;
    title: string;
    subtitle?: string;
    preview: string;
    img: string;
}

@Component({
    selector: 'app-read-alongs',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './read-alongs.component.html',
    styleUrl: './read-alongs.component.scss'
})
export class ReadAlongsComponent {
    items: ReadAlongItem[] = [
        {
            id: 'postoak-1',
            title: 'John R. Postoak letter to A. E. W. Robertson',
            subtitle: 'December 11, 1878',
            preview: 'Hiyomat vm opunvkv mahusan es cen coyet omis. Vm vnokeckv vm vhayv tate toyetskat...',
            img: 'read-alongs/postoak-01.png',
        },
    ];

    private svgDataUrl(text: string): string {
        const escaped = encodeURIComponent(text);
        return `data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><rect width='100%' height='100%' fill='%232563eb'/><text x='50%' y='50%' fill='%23fff' font-size='20' text-anchor='middle' dominant-baseline='middle'>${escaped}</text></svg>`;
    }
}
