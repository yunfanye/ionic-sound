import { ApiProvider } from './../../providers/api/api';
import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { Media, MediaObject } from '@ionic-native/media';
import { File } from '@ionic-native/file';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  recording: boolean = false;
  mediaFilePath: string; // "file://" gets removed 
  filePath: string;
  fileName: string;
  audio: MediaObject;
  audioSuffix: string;
  playingAudio: MediaObject;
  playingPath: string;
  audioList: any[] = [];

  constructor(public navCtrl: NavController,
    private media: Media,
    private file: File,
    public platform: Platform,
    public apiProvider: ApiProvider) {
    this.platform.ready().then(() => {
      // Initialize platform specific variables
      if (this.platform.is('ios')) {
        this.filePath = this.file.documentsDirectory;
        this.mediaFilePath = this.file.documentsDirectory.replace(/file:\/\//g, '');
        this.audioSuffix = '.m4a';
      } else if (this.platform.is('android')) {
        this.filePath = this.file.externalDataDirectory;
        this.mediaFilePath = this.file.externalDataDirectory.replace(/file:\/\//g, '');
        this.audioSuffix = '.3gp';
      }      
    });
  }

  getAudioList() {
    if (localStorage.getItem("audiolist")) {
      this.audioList = JSON.parse(localStorage.getItem("audiolist"));
    }
  }

  ionViewWillEnter() {
    this.getAudioList();
  }

  startRecord() {
    const nowTime = new Date();
    const fileNameBase = 'record' + nowTime.getDate() + nowTime.getMonth() + nowTime.getFullYear() + nowTime.getHours() + nowTime.getMinutes() + nowTime.getSeconds();
    this.fileName = fileNameBase + this.audioSuffix;
    this.audio = this.media.create(this.mediaFilePath + this.fileName);
    this.audio.startRecord();
    this.recording = true;
  }

  stopRecord() {
    this.audio.stopRecord();
    this.audio.release()
    const data = { filename: this.fileName };
    this.audioList.unshift(data);
    localStorage.setItem("audiolist", JSON.stringify(this.audioList));
    this.recording = false;
    this.getAudioList();
    this.sendAudioForEval();
  }

  sendAudioForEval() {
    this.file.readAsDataURL(this.filePath, this.fileName)
      .then(base64File => {
        // The base64 strings starts with "data:...base64,", remove this part
        base64File = base64File.substring(base64File.indexOf('base64,')+ 'base64,'.length);
        this.apiProvider.getTranscription(base64File)
          .subscribe(
            data => {
            console.log("getTranscription returned: ", JSON.stringify(data));
          }, err => console.error(JSON.stringify(err)));
      })
      .catch(err => {
        console.error('Failed to read audio file:', JSON.stringify(err));
      });
  }

  playAudio(file, idx) {
    this.playingPath = this.mediaFilePath + file;
    this.playingAudio = this.media.create(this.playingPath);
    this.playingAudio.play();
    this.playingAudio.setVolume(0.8);
  }

}
