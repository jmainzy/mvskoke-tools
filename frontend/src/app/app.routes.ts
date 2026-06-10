import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SearchResultsComponent } from './search/search.component';
import { SpeechRecognitionComponent } from './speech-recognition/speech-recognition.component';
import { CreekFmComponent } from './creek-fm/creek-fm.component';
import { ReadAlongsComponent } from './read-alongs/read-alongs.component';
import { ReadAlongDetailComponent } from './read-alongs/read-along-detail.component';
import { ViewerComponent } from './viewer/viewer.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'search', component: SearchResultsComponent },
    { path: 'speech-recognition', component: SpeechRecognitionComponent },
    { path: 'creek-fm', component: CreekFmComponent },
    { path: 'read-alongs', component: ReadAlongsComponent },
    { path: 'read-alongs/:id', component: ReadAlongDetailComponent },
    { path: 'view/:filename', component: ViewerComponent },
    { path: '**', redirectTo: '' }
];
