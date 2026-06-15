import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService, ReadAlongItem } from '../services/data.service';

@Component({
    selector: 'app-read-alongs',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './read-alongs.component.html',
    styleUrl: './read-alongs.component.scss'
})
export class ReadAlongsComponent implements OnInit {
    private readonly dataService = inject(DataService);

    items: ReadAlongItem[] = [];

    ngOnInit(): void {
        this.dataService.getReadAlongs().subscribe(items => this.items = items);
    }
}
