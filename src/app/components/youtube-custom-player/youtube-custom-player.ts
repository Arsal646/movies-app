/*
 * YouTubeCustomPlayerComponent – mobile fullscreen‑button fix
 * -----------------------------------------------------------
 * • Controls bar now wraps and centers on small screens so the fullscreen
 *   button (⛶) never gets pushed off‑screen.
 * • Added safe‑area padding for iOS notch devices.
 * • Enlarged tap targets and seek bar on mobile.
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
    <div #container
         class="player-container"
         [class.hide-ui]="uiHidden"
         [class.is-fullscreen]="isFullscreen"
         (mousemove)="showUI()"
         (mouseleave)="hideUI()">

      <div #player></div>

      <div class="pause-overlay" [class.active]="paused">
        <button class="control-btn" (click)="togglePlay()">Resume ▶</button>
      </div>

      <div class="controls-bar">
        <button class="control-btn" (click)="togglePlay()">{{ paused ? '▶' : '⏸' }}</button>
        <button class="control-btn" (click)="toggleMute()">{{ muted ? '🔇' : '🔊' }}</button>
        <input class="seek" type="range" [max]="duration" [value]="currentTime" (input)="onSeek($event)">
        <span class="time">{{ timeText }}</span>
        <button class="control-btn" (click)="toggleFullscreen()">⛶</button>
      </div>

      <div class="brand-cover top"></div>
      <div class="brand-cover bottom"></div>
    </div>
  `,
  styles: [
    `:host{display:block;height:100%;--bg:#111827;--btn:#1f2937;--btn-hover:#374151;--accent:#3b82f6;}

     .player-container{position:relative;width:640px;max-width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,.6);overflow:hidden;}
     .player-container.is-fullscreen{width:100vw;height:100vh;aspect-ratio:auto;border-radius:0;}
     .player-container>div:first-child,.player-container iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0;}
     .player-container.is-fullscreen iframe{object-fit:cover;}

     .brand-cover{position:absolute;left:0;width:100%;pointer-events:none;background:var(--bg);z-index:4;}
     .brand-cover.top{top:0;height:40px;}
     .brand-cover.bottom{bottom:0;height:26px;}

     .pause-overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:#000;z-index:3;}
     .pause-overlay.active{display:flex;}

     .controls-bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);z-index:5;transition:opacity .3s;flex-wrap:nowrap;}
     .player-container.hide-ui .controls-bar{opacity:0;pointer-events:none;}

     .control-btn{background:var(--btn);border:none;color:#fff;padding:6px 10px;border-radius:6px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s,transform .1s;flex:0 0 auto;}
     .control-btn:hover{background:var(--btn-hover);} .control-btn:active{transform:scale(.95);} 

     .seek{flex:1 1 auto;height:4px;cursor:pointer;-webkit-appearance:none;background:#4b5563;border-radius:2px;}
     .seek::-webkit-slider-thumb{appearance:none;width:12px;height:12px;border-radius:50%;background:var(--accent);cursor:pointer;border:none;transform:translateY(-4px);} 
     .seek::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;}

     .time{font-size:13px;min-width:68px;text-align:center;flex:0 0 auto;}

     /* ---------- Mobile adjustments ---------- */
     @media(max-width:640px){
       .player-container{width:100vw!important;height:calc(100vw*9/16)!important;border-radius:0;}

       .controls-bar{flex-wrap:wrap;gap:8px;padding:10px 16px calc(10px + env(safe-area-inset-bottom));justify-content:center;}

       .control-btn{padding:10px 12px;font-size:20px;border-radius:8px;min-width:44px;min-height:44px;}

       .seek{order:3;flex:1 1 100%;height:8px;margin-top:6px;}
       .seek::-webkit-slider-thumb,.seek::-moz-range-thumb{width:18px;height:18px;transform:translateY(-6px);} 

       .time{order:4;font-size:15px;min-width:60px;}
     }
    `
  ]
})
export class YouTubeCustomPlayerComponent implements AfterViewInit, OnDestroy {

  @Input() videoId = 'edqUUEMsTME';

  @ViewChild('container',{static:true}) containerRef!:ElementRef<HTMLElement>;
  @ViewChild('player',{static:true})    playerHost!:ElementRef<HTMLElement>;

  private player!:any;
  currentTime=0;duration=0;muted=false;paused=true;timeText='0:00 / 0:00';uiHidden=false;isFullscreen=false;
  private raf=0;private hideUITimer:any;

  constructor(private cdr:ChangeDetectorRef){}

  ngAfterViewInit(){this.loadYT();}
  ngOnDestroy(){cancelAnimationFrame(this.raf);clearTimeout(this.hideUITimer);if(this.player?.destroy)this.player.destroy();}

  private loadYT(){if(window.YT?.Player){this.initPlayer();return;}const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';document.body.appendChild(s);window.onYouTubeIframeAPIReady=()=>this.initPlayer();}

  private initPlayer(){this.player=new window.YT.Player(this.playerHost.nativeElement,{videoId:this.videoId,playerVars:{controls:0,rel:0,modestbranding:1,showinfo:0,fs:1,playsinline:1,iv_load_policy:3},events:{onReady:()=>this.onReady(),onStateChange:(e:any)=>this.onState(e)}});}

  private onReady(){this.duration=this.player.getDuration();this.timeText=`0:00 / ${this.fmt(this.duration)}`;this.cdr.markForCheck();this.updateLoop();}

  togglePlay(){this.paused?this.player.playVideo():this.player.pauseVideo();}
  toggleMute(){this.muted=!this.muted;this.muted?this.player.mute():this.player.unMute();}
  onSeek(e:Event){this.player.seekTo(+(<HTMLInputElement>e.target).value,true);}
  toggleFullscreen(){const el=this.containerRef.nativeElement;if(!document.fullscreenElement){(el.requestFullscreen||(<any>el).webkitRequestFullscreen||(<any>el).msRequestFullscreen).call(el);}else{(document.exitFullscreen||(<any>document).webkitExitFullscreen||(<any>document).msExitFullscreen).call(document);}}

  @HostListener('document:fullscreenchange') onFS(){this.isFullscreen=!!document.fullscreenElement;this.adjustSize();this.showUI();}
  @HostListener('window:resize') onResize(){if(this.isFullscreen) this.adjustSize();}

  private adjustSize(){if(!this.player?.setSize)return;this.player.setSize(window.innerWidth,window.innerHeight);}
  private onState(e:any){const{PLAYING,PAUSED,ENDED}=window.YT.PlayerState;if(e.data===PLAYING){this.paused=false;}if(e.data===PAUSED||e.data===ENDED){this.paused=true;}this.showUI();}
  private updateLoop(){this.currentTime=this.player.getCurrentTime();this.timeText=`${this.fmt(this.currentTime)} / ${this.fmt(this.duration)}`;this.raf=requestAnimationFrame(()=>this.updateLoop());}
  showUI(){this.uiHidden=false;clearTimeout(this.hideUITimer);this.hideUITimer=setTimeout(()=>{this.uiHidden=true;this.cdr.markForCheck();},3000);this.cdr.markForCheck();}
  hideUI(){this.uiHidden=true;this.cdr.markForCheck();}
  private fmt(sec:number){sec=Math.floor(sec);return`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;}
}
