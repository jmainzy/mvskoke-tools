import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SpeechRecognitionComponent } from './speech-recognition/speech-recognition.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'speech-recognition', component: SpeechRecognitionComponent },
    { path: '**', redirectTo: '' }
];
