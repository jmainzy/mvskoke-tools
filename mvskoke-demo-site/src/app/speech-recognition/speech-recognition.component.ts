import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-speech-recognition',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './speech-recognition.component.html',
    styleUrl: './speech-recognition.component.scss'
})
export class SpeechRecognitionComponent { }
