
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
        <span class="time">{{ timeText }}</span>
        <input class="seek" type="range" [max]="duration" [value]="currentTime" (input)="onSeek($event)">
        <button class="control-btn" (click)="toggleFullscreen()">⛶</button>
      </div>

      <div class="brand-cover top"></div>
      <div class="brand-cover bottom"></div>
    </div>
  `,
  styles: [
    `:host{display:block;height:100%;--bg:#111827;--btn:#1f2937;--btn-hover:#374151;--accent:#3b82f6;}

     .player-container{position:relative;width:640px;max-width:100%;aspect-ratio:16/9;background:#000;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,.6);overflow:hidden;}
     /* When element itself is in FS, vw/vh = 100% */
     .player-container.is-fullscreen{width:100vw;height:100vh;aspect-ratio:auto;border-radius:0;}
     .player-container>div:first-child,.player-container iframe{position:absolute;inset:0;width:100%!important;height:100%!important;border:0;}
     .player-container.is-fullscreen iframe{object-fit:cover;}

     .brand-cover{position:absolute;left:0;width:100%;pointer-events:none;background:var(--bg);z-index:4;}
     .brand-cover.top{top:0;height:40px;}
     .brand-cover.bottom{bottom:0;height:26px;}

     .pause-overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:#000;z-index:3;}
     .pause-overlay.active{display:flex;}

     .controls-bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);z-index:5;transition:opacity .3s;}
     .player-container.hide-ui .controls-bar{opacity:0;pointer-events:none;}

     .control-btn{background:var(--btn);border:none;color:#fff;padding:6px 10px;border-radius:6px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s,transform .1s;}
     .control-btn:hover{background:var(--btn-hover);} .control-btn:active{transform:scale(.95);} 

     .seek{flex:1;height:4px;cursor:pointer;-webkit-appearance:none;background:#4b5563;border-radius:2px;}
     .seek::-webkit-slider-thumb{appearance:none;width:12px;height:12px;border-radius:50%;background:var(--accent);cursor:pointer;border:none;transform:translateY(0);} 
     .seek::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;}

     .time{font-size:13px;min-width:68px;text-align:center;}
    `
  ]
})
export class YouTubeCustomPlayerComponent implements AfterViewInit, OnDestroy {

  @Input() videoId = 'edqUUEMsTME';

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;
  @ViewChild('player', { static: true }) playerHost!: ElementRef<HTMLElement>;

  private player!: any;
  currentTime = 0;
  duration = 0;
  muted = false;
  paused = true;
  timeText = '0:00 / 0:00';
  uiHidden = false;
  isFullscreen = false;

  private raf = 0;
  private hideUITimer!: any;

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit(): void { this.loadYT(); }
  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.hideUITimer);
    if (this.player?.destroy) this.player.destroy();
  }

  /* ---------- YouTube setup ---------- */
  private loadYT(): void {
    if (window.YT?.Player) { this.initPlayer(); return; }
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
    window.onYouTubeIframeAPIReady = () => this.initPlayer();
  }

  private initPlayer(): void {
    this.player = new window.YT.Player(this.playerHost.nativeElement, {
      videoId: this.videoId,
      playerVars: { controls: 0, rel: 0, modestbranding: 1, showinfo: 0, fs: 1, playsinline: 1, iv_load_policy: 3 },
      events: { onReady: () => this.onReady(), onStateChange: (e: any) => this.onState(e) }
    });
  }

  private onReady(): void {
    this.duration = this.player.getDuration();
    this.timeText = `0:00 / ${this.fmt(this.duration)}`;
    this.cdr.markForCheck();
    this.updateLoop();
  }

  /* ---------- Controls ---------- */
  togglePlay(): void { (this.paused) ? this.player.playVideo() : this.player.pauseVideo(); }
  toggleMute(): void { this.muted = !this.muted; this.muted ? this.player.mute() : this.player.unMute(); }
  onSeek(e: Event): void { this.player.seekTo(+(<HTMLInputElement>e.target).value, true); }
  toggleFullscreen(): void {
    const el = this.containerRef.nativeElement;
    if (!document.fullscreenElement) {
      (el.requestFullscreen || (<any>el).webkitRequestFullscreen || (<any>el).msRequestFullscreen).call(el);
    } else {
      (document.exitFullscreen || (<any>document).webkitExitFullscreen || (<any>document).msExitFullscreen).call(document);
    }
  }

  @HostListener('document:fullscreenchange') onFS(): void {
    this.isFullscreen = !!document.fullscreenElement;
    this.adjustSize();
    this.showUI();
  }

  @HostListener('window:resize') onResize(): void { if (this.isFullscreen) this.adjustSize(); }

  private adjustSize(): void {
    if (!this.player?.setSize) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.player.setSize(w, h);
  }

  /* ---------- Player state ---------- */
  private onState(e: any): void {
    const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
    if (e.data === PLAYING) { this.paused = false; } if (e.data === PAUSED || e.data === ENDED) { this.paused = true; }
    this.showUI();
  }

  /* ---------- Loop ---------- */
  private updateLoop(): void {
    this.currentTime = this.player.getCurrentTime();
    this.timeText = `${this.fmt(this.currentTime)} / ${this.fmt(this.duration)}`;
    this.raf = requestAnimationFrame(() => this.updateLoop());
  }

  /* ---------- UI auto‑hide ---------- */
  showUI(): void { this.uiHidden = false; clearTimeout(this.hideUITimer); this.hideUITimer = setTimeout(() => { this.uiHidden = true; this.cdr.markForCheck(); }, 3000); this.cdr.markForCheck();
  if (!this.isMobile()) {
    this.hideUITimer = setTimeout(() => {
      this.uiHidden = true;
      this.cdr.markForCheck();
    }, 3000);
  }
}
  hideUI(): void { this.uiHidden = true; this.cdr.markForCheck(); }

  private isMobile(): boolean {
    return window.innerWidth <= 640;
  }


  /* ---------- util ---------- */
  private fmt(sec: number): string { sec = Math.floor(sec); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
}
