import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PlaylistItem {
    title: string;
    src: string;
}

@Component({
    selector: 'app-creek-fm',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './creek-fm.component.html',
    styleUrl: './creek-fm.component.scss'
})
export class CreekFmComponent implements AfterViewInit, OnDestroy {
    @ViewChild('audioPlayer', { static: true }) audioRef!: ElementRef<HTMLAudioElement>;

    playlist: PlaylistItem[] = [
        { title: 'The three brothers and the spotted horse', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183157/mus08010.mp3' },
        { title: 'The hunter and his dogs', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10182445/mus08002.mp3' },
        { title: 'Tug of war between the tie-snakes, tar baby', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10182754/mus08003.mp3' },
        { title: 'The stork father', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10182929/mus08005.mp3' },
        { title: 'Rabbit steals fire', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183003/mus08006.mp3' },
        { title: 'Turtle is beaten by three mothers', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183035/mus08007.mp3' },
        { title: 'Rabbit rides Wolf', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183103/mus08008.mp3' },
        { title: 'Turtle races Wolf', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183131/mus08009.mp3' },
        { title: 'The young man who turned into a snake', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183157/mus08010.mp3' },
    ];

    recentlyPlayed: PlaylistItem[] = [];
    currentHistoryIndex = -1;
    isPlaying = false;

    get currentSrc(): string {
        return this.recentlyPlayed[this.currentHistoryIndex]?.src ?? '';
    }

    get currentTrackTitle(): string {
        return this.recentlyPlayed[this.currentHistoryIndex]?.title ?? '';
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
