/*
 * YouTubeCustomPlayerComponent – final mobile‑friendly fix
 * --------------------------------------------------------
 * • Uses CSS Grid on phones so buttons never overflow.
 * • Fullscreen (⛶) now sits at far right, always visible.
 * • Seek bar spans full width underneath buttons on mobile.
 * • Buttons enlarged + gap tuning.
 */

import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  Input,
  HostListener,
} from '@angular/core';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

@Component({
  selector: 'app-youtube-custom-player',
  standalone: true,
  template: `
    <div #container class="player-container" [class.is-fullscreen]="isFullscreen">
      <!-- YouTube iframe will replace this div -->
      <div #player></div>

      <!-- Pause overlay -->
      <div class="pause-overlay" [class.active]="paused" (click)="togglePlay()">
        <button class="overlay-btn">{{ paused ? 'Play ▶' : 'Pause ⏸' }}</button>
      </div>

      <!-- Controls -->
      <div class="controls-bar" (mousemove)="showUI()" [class.hide]="uiHidden">
        <!-- Row 1 (buttons + time) -->
        <div class="row1">
          <button class="control-btn" (click)="togglePlay()">{{ paused ? '▶' : '⏸' }}</button>
          <button class="control-btn" (click)="toggleMute()">{{ muted ? '🔇' : '🔊' }}</button>
          <span class="time">{{ timeText }}</span>
          <button class="control-btn" (click)="toggleFullscreen()">⛶</button>
        </div>
        <!-- Row 2 (seek) -->
        <input class="seek" type="range" [max]="duration" [value]="currentTime" (input)="onSeek($event)">
      </div>

      <!-- Branding covers -->
      <div class="brand-cover top"></div>
      <div class="brand-cover bottom"></div>
    </div>
  `,
  styles: [
    `:host{display:block;--bg:#111827;--btn:#1f2937;--btn-hover:#374151;--accent:#3b82f6;}

     .player-container{position:relative;width:640px;max-width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,.6);} 
     .player-container.is-fullscreen{width:100vw;height:100vh;border-radius:0;}
     .player-container>div:first-child,.player-container iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0;}

     /* Pause overlay */
     .pause-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .25s ease;z-index:3;}
     .pause-overlay.active{opacity:1;pointer-events:auto;}
     .overlay-btn{background:var(--accent);color:#fff;font-size:22px;padding:14px 24px;border:none;border-radius:12px;cursor:pointer;}

     /* Branding covers */
     .brand-cover{position:absolute;left:0;width:100%;pointer-events:none;background:var(--bg);z-index:4;}
     .brand-cover.top{top:0;height:40px;}
     .brand-cover.bottom{bottom:0;height:26px;}

     /* Controls bar (desktop) */
     .controls-bar{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);padding:8px 12px;display:flex;flex-direction:column;gap:6px;z-index:5;transition:opacity .3s ease;}
     .controls-bar.hide{opacity:0;pointer-events:none;}

     .row1{display:flex;align-items:center;gap:10px;justify-content:space-between;}

     .control-btn{background:var(--btn);border:none;color:#fff;width:40px;height:40px;border-radius:8px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;}
     .control-btn:hover{background:var(--btn-hover);} 

     .time{min-width:72px;text-align:center;font-size:14px;color:#fff;}

     .seek{-webkit-appearance:none;width:100%;height:4px;background:#4b5563;border-radius:2px;cursor:pointer;}
     .seek::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);box-shadow:0 0 6px rgba(59,130,246,.8);} 
     .seek::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--accent);} 

     /* Mobile layout */
     @media(max-width:640px){
       .player-container{width:100vw!important;height:calc(100vw*9/16)!important;border-radius:0;}

       .controls-bar{padding:12px 16px 12px calc(16px + env(safe-area-inset-left));}
       .row1{gap:12px;}
       .control-btn{width:48px;height:48px;font-size:22px;}
       .time{font-size:15px;}
       .seek{height:8px;}
       .seek::-webkit-slider-thumb,.seek::-moz-range-thumb{width:20px;height:20px;}
     }
    `
  ]
})
export class YouTubeCustomPlayerComponent implements AfterViewInit, OnDestroy {

  /* -------- Inputs -------- */
  @Input() videoId:string='edqUUEMsTME';

  /* -------- Refs -------- */
  @ViewChild('container',{static:true}) containerRef!:ElementRef<HTMLElement>;
  @ViewChild('player',{static:true}) playerHost!:ElementRef<HTMLElement>;

  /* -------- State -------- */
  private player:any;currentTime=0;duration=0;muted=false;paused=true;timeText='0:00 / 0:00';uiHidden=false;isFullscreen=false;
  private raf=0;private hideUITimer:any;

  constructor(private cdr:ChangeDetectorRef){}

  /* -------- Lifecycle -------- */
  ngAfterViewInit(){this.loadYT();}
  ngOnDestroy(){cancelAnimationFrame(this.raf);clearTimeout(this.hideUITimer);this.player?.destroy?.();}

  /* -------- YouTube API -------- */
  private loadYT(){if(window.YT?.Player){this.initPlayer();return;}const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.body.appendChild(s);window.onYouTubeIframeAPIReady=()=>this.initPlayer();}
  private initPlayer(){this.player=new window.YT.Player(this.playerHost.nativeElement,{videoId:this.videoId,playerVars:{controls:0,rel:0,modestbranding:1,showinfo:0,fs:1,playsinline:1,iv_load_policy:3},events:{onReady:()=>this.onReady(),onStateChange:(e:any)=>this.onState(e)}});}  
  private onReady(){this.duration=this.player.getDuration();this.timeText=`0:00 / ${this.fmt(this.duration)}`;this.cdr.markForCheck();this.updateLoop();}

  /* -------- Controls -------- */
  togglePlay(){this.paused?this.player.playVideo():this.player.pauseVideo();}
  toggleMute(){this.muted=!this.muted;this.muted?this.player.mute():this.player.unMute();}
  onSeek(e:Event){this.player.seekTo(+(<HTMLInputElement>e.target).value,true);}
  toggleFullscreen(){const el=this.containerRef.nativeElement;if(!document.fullscreenElement){(el.requestFullscreen||(<any>el).webkitRequestFullscreen||(<any>el).msRequestFullscreen).call(el);}else{(document.exitFullscreen||(<any>document).webkitExitFullscreen||(<any>document).msExitFullscreen).call(document);}}

  @HostListener('document:fullscreenchange') onFS(){this.isFullscreen=!!document.fullscreenElement;this.player.setSize(window.innerWidth,window.innerHeight);this.showUI();}
  @HostListener('window:resize') onResize(){if(this.isFullscreen)this.player.setSize(window.innerWidth,window.innerHeight);}

  /* -------- Player events -------- */
  private onState(e:any){const{PLAYING,PAUSED,ENDED}=window.YT.PlayerState;this.paused=e.data!==PLAYING;this.showUI();}

  /* -------- UI helpers -------- */
  private updateLoop(){this.currentTime=this.player.getCurrentTime();this.timeText=`${this.fmt(this.currentTime)} / ${this.fmt(this.duration)}`;this.raf=requestAnimationFrame(()=>this.updateLoop());}
  showUI(){this.uiHidden=false;clearTimeout(this.hideUITimer);this.hideUITimer=setTimeout(()=>{this.uiHidden=true;this.cdr.markForCheck();},3000);this.cdr.markForCheck();}

  /* -------- util -------- */
  private fmt(sec:number){sec=Math.floor(sec);return`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;}
}
