import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface ReadAlongItem {
    id: string;
    title: string;
    preview: string;
    img: string;
}

@Component({
    selector: 'app-read-along-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './read-along-detail.component.html',
    styleUrl: './read-along-detail.component.scss'
})
export class ReadAlongDetailComponent {
    item: ReadAlongItem | undefined;

    private items: ReadAlongItem[] = [
        { id: 'story-1', title: 'The Three Brothers', preview: 'A short traditional tale about three brothers and a spotted horse.', img: this.svgDataUrl('The Three Brothers') },
        { id: 'story-2', title: 'Rabbit Steals Fire', preview: 'A classic trickster story about Rabbit and the origin of fire.', img: this.svgDataUrl('Rabbit Steals Fire') },
        { id: 'story-3', title: 'Turtle Races Wolf', preview: 'Turtle outsmarts Wolf in a surprising race.', img: this.svgDataUrl('Turtle Races Wolf') }
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
