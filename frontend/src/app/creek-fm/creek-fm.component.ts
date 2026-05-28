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

    playlists: Record<string, PlaylistItem[]> = {
        'Radio Show': [
            { title: 'Weekly Report', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183157/mus08010.mp3' },
            { title: 'Music Hour Special', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10182445/mus08002.mp3' },
            { title: 'Community News', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10182754/mus08003.mp3' },
        ],
        'Songs': [
            { title: 'Ohrolope Mucvsepen', src: 'https://esyvhiketv.sfo3.cdn.digitaloceanspaces.com/ohrolope-mucvsepen-mvskoke-hymns.mp3' },
            { title: 'Aeha Kut Cvhesayecv', src: 'https://esyvhiketv.sfo3.cdn.digitaloceanspaces.com/aeha-kut-cvhesayecv-elouise.mp3' },
            { title: 'Espoke Tis Omēs Kerrēskos', src: 'https://esyvhiketv.sfo3.cdn.digitaloceanspaces.com/espoke-tis-ome%CC%84s-kerre%CC%84skos.mp3' },
            { title: 'Hesaketvmeset Likes', src: 'https://esyvhiketv.sfo3.cdn.digitaloceanspaces.com/hesaketvmese%CC%84-like%CC%84s.mp3' },
            { title: 'Vnokeckvt Omēcicēn', src: 'https://esyvhiketv.sfo3.cdn.digitaloceanspaces.com/vnokeckv-ome%CC%84cice%CC%84n.mp3' },
            { title: 'Vpēyvkvrēs', src: 'https://esyvhiketv.sfo3.cdn.digitaloceanspaces.com/vpe%CC%84yvkvre%CC%84s.mp3' },
        ],
        'Stories': [
            { title: 'The three brothers and the spotted horse', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183157/mus08010.mp3' },
            { title: 'The hunter and his dogs', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10182445/mus08002.mp3' },
            { title: 'Tug of war between the tie-snakes, tar baby', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10182754/mus08003.mp3' },
            { title: 'The stork father', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10182929/mus08005.mp3' },
            { title: 'Rabbit steals fire', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183003/mus08006.mp3' },
            { title: 'Turtle is beaten by three mothers', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183035/mus08007.mp3' },
            { title: 'Rabbit rides Wolf', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183103/mus08008.mp3' },
            { title: 'Turtle races Wolf', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183131/mus08009.mp3' },
            { title: 'The young man who turned into a snake', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183157/mus08010.mp3' },
        ],
        'Interviews': [
            { title: 'Edna', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183103/mus08008.mp3' },
            { title: 'Language Preservation', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183131/mus08009.mp3' },
            { title: 'Gracine', src: 'https://wmit-pages-prod.s3.amazonaws.com/wp-content/uploads/sites/148/2016/12/10183157/mus08010.mp3' },
        ],
    };

    recentlyPlayed: PlaylistItem[] = [];
    currentHistoryIndex = -1;
    isPlaying = false;
    shuffleOn = false;
    channels: string[] = ['Radio Show', 'Songs', 'Stories', 'Interviews'];
    selectedChannel = this.channels[0];

    get playlist(): PlaylistItem[] {
        return this.playlists[this.selectedChannel] ?? [];
    }

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
        audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updateMediaSessionPlaybackState();
        });
        audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateMediaSessionPlaybackState();
        });

        this.setupMediaSession();
        this.updateMediaSessionMetadata();
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

    toggleShuffle(): void {
        this.shuffleOn = !this.shuffleOn;
    }

    selectChannel(ch: string): void {
        this.selectedChannel = ch;
        this.recentlyPlayed = [];
        this.currentHistoryIndex = -1;
        const audio = this.audioRef.nativeElement;
        audio.src = '';
        audio.pause();
        this.isPlaying = false;
        this.updateMediaSessionMetadata();
    }

    playIndex(index: number): void {
        if (index < 0 || index >= this.recentlyPlayed.length) return;
        this.currentHistoryIndex = index;
        const audio = this.audioRef.nativeElement;
        audio.src = this.currentSrc;
        this.updateMediaSessionMetadata();
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

        const nextTrack = this.shuffleOn ? this.getRandomNextTrack() : this.getNextSequentialTrack();

        if (!nextTrack) {
            return;
        }

        this.recentlyPlayed.unshift(nextTrack);
        this.currentHistoryIndex = 0;
        const audio = this.audioRef.nativeElement;
        audio.src = this.currentSrc;
        this.updateMediaSessionMetadata();
        void audio.play();
    }

    private getNextSequentialTrack(): PlaylistItem | undefined {
        return this.playlist.find(
            (track) => !this.recentlyPlayed.some((played) => played.src === track.src)
        );
    }

    private getRandomNextTrack(): PlaylistItem | undefined {
        const availableTracks = this.playlist.filter(
            (track) => !this.recentlyPlayed.some((played) => played.src === track.src)
        );

        if (availableTracks.length > 0) {
            return availableTracks[Math.floor(Math.random() * availableTracks.length)];
        }

        const otherTracks = this.playlist.filter((track) => track.src !== this.currentSrc);
        if (otherTracks.length === 0) {
            return undefined;
        }

        return otherTracks[Math.floor(Math.random() * otherTracks.length)];
    }

    prev(): void {
        if (this.currentHistoryIndex < 0 || this.currentHistoryIndex >= this.recentlyPlayed.length - 1) {
            return;
        }

        this.currentHistoryIndex += 1;
        const audio = this.audioRef.nativeElement;
        audio.src = this.currentSrc;
        this.updateMediaSessionMetadata();
        void audio.play();
    }

    private setupMediaSession(): void {
        if (!('mediaSession' in navigator)) {
            return;
        }

        navigator.mediaSession.setActionHandler('play', () => this.audioRef.nativeElement.play());
        navigator.mediaSession.setActionHandler('pause', () => this.audioRef.nativeElement.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    }

    private updateMediaSessionMetadata(): void {
        if (!('mediaSession' in navigator)) {
            return;
        }

        const mediaSession = navigator.mediaSession;
        if (!this.currentSrc) {
            mediaSession.metadata = null as any;
            return;
        }

        if (typeof MediaMetadata !== 'undefined') {
            mediaSession.metadata = new MediaMetadata({
                title: this.currentTrackTitle,
                artist: 'CreekFM',
                album: 'Mvskoke',
                artwork: [
                    {
                        src: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="100%" height="100%" fill="%232563eb"/><text x="50%" y="50%" fill="%23fff" font-size="28" text-anchor="middle" dominant-baseline="middle">FM</text></svg>',
                        sizes: '96x96',
                        type: 'image/svg+xml'
                    }
                ]
            });
        }

        this.updateMediaSessionPlaybackState();
    }

    private updateMediaSessionPlaybackState(): void {
        if (!('mediaSession' in navigator)) {
            return;
        }

        navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    }

    private onEnded = (): void => {
        this.next();
    };
}
