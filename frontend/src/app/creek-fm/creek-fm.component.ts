import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

interface PlaylistItem {
    title: string;
    src: string;
}

@Component({
    selector: 'app-creek-fm',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './creek-fm.component.html',
    styleUrl: './creek-fm.component.scss'
})
export class CreekFmComponent implements AfterViewInit, OnDestroy {
    @ViewChild('audioPlayer', { static: true }) audioRef!: ElementRef<HTMLAudioElement>;

    playlist: PlaylistItem[] = [
        { title: 'SoundHelix Song 1', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
        { title: 'SoundHelix Song 2', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { title: 'SoundHelix Song 3', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
    ];

    recentlyPlayed: PlaylistItem[] = [];
    currentHistoryIndex = -1;
    isPlaying = false;

    get currentSrc(): string {
        return this.recentlyPlayed[this.currentHistoryIndex]?.src ?? '';
    }

    ngAfterViewInit(): void {
        const audio = this.audioRef.nativeElement;
        audio.src = this.currentSrc;
        audio.addEventListener('ended', this.onEnded);
        audio.addEventListener('play', () => (this.isPlaying = true));
        audio.addEventListener('pause', () => (this.isPlaying = false));
    }

    ngOnDestroy(): void {
        const audio = this.audioRef?.nativeElement;
        if (audio) {
            audio.removeEventListener('ended', this.onEnded);
        }
    }

    togglePlay(): void {
        const audio = this.audioRef.nativeElement;
        if (audio.paused) {
            if (!this.currentSrc) {
                this.next();
                return;
            }
            audio.play();
        } else {
            audio.pause();
        }
    }

    playIndex(index: number): void {
        if (index < 0 || index >= this.recentlyPlayed.length) return;
        this.currentHistoryIndex = index;
        const audio = this.audioRef.nativeElement;
        audio.src = this.currentSrc;
        void audio.play();
    }

    next(): void {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex -= 1;
            const audio = this.audioRef.nativeElement;
            audio.src = this.currentSrc;
            void audio.play();
            return;
        }

        const nextTrack = this.playlist.find(
            (track) => !this.recentlyPlayed.some((played) => played.src === track.src)
        );

        if (!nextTrack) {
            return;
        }

        this.recentlyPlayed.unshift(nextTrack);
        this.currentHistoryIndex = 0;
        const audio = this.audioRef.nativeElement;
        audio.src = this.currentSrc;
        void audio.play();
    }

    prev(): void {
        if (this.currentHistoryIndex < 0 || this.currentHistoryIndex >= this.recentlyPlayed.length - 1) {
            return;
        }

        this.currentHistoryIndex += 1;
        const audio = this.audioRef.nativeElement;
        audio.src = this.currentSrc;
        void audio.play();
    }

    private onEnded = (): void => {
        this.next();
    };
}
