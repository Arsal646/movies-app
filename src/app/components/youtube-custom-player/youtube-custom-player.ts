import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  Input,
  HostListener,
  PLATFORM_ID,
  Inject,
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
  imports:[CommonModule],
  template: `
    <div #container
         class="player-container"
         [class.hide-ui]="uiHidden"
         [class.is-fullscreen]="isFullscreen"
         [class.is-mobile]="isMobile()"
         (mousemove)="showUI()"
         (mouseleave)="hideUI()"
         (touchstart)="onTouch()"
         (click)="onContainerClick($event)">

      <div #player></div>

      <div class="pause-overlay" [class.active]="paused" (click)="togglePlay()">
        <button class="pause-play-btn" tabindex="-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path *ngIf="paused" d="M8 5v14l11-7z"/>
            <path *ngIf="!paused" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        </button>
      </div>

      <div class="controls-bar">
        <div class="controls-row">
          <!-- Progress bar on top for mobile -->
          <div class="progress-container" [class.mobile-top]="isMobile()">
            <input class="seek" 
                   type="range" 
                   [max]="duration" 
                   [value]="currentTime" 
                   (input)="onSeek($event)"
                   (touchstart)="$event.stopPropagation()">
          </div>
          
          <!-- Controls row -->
          <div class="button-controls">
            <button class="control-btn play-pause" (click)="togglePlay()" aria-label="Play/Pause">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path *ngIf="paused" d="M8 5v14l11-7z"/>
                <path *ngIf="!paused" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
            
            <button class="control-btn volume" (click)="toggleMute()" aria-label="Mute/Unmute">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path *ngIf="!muted" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                <path *ngIf="muted" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            </button>
            
            <span class="time">{{ timeText }}</span>
            
            <div class="spacer"></div>
            
            <button class="control-btn fullscreen" (click)="toggleFullscreen()" aria-label="Fullscreen">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path *ngIf="!isFullscreen" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                <path *ngIf="isFullscreen" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="brand-cover top"></div>
      <div class="brand-cover bottom"></div>
    </div>
  `,
  styles: [
    `:host {
      display: block;
      height: 100%;
      --bg: #111827;
      --btn: rgba(31, 41, 55, 0.8);
      --btn-hover: rgba(55, 65, 81, 0.9);
      --accent: #3b82f6;
      --controls-bg: rgba(0, 0, 0, 0.7);
      --text-primary: #ffffff;
      --text-secondary: #d1d5db;
    }

    .player-container {
      position: relative;
      width: 100%;
      max-width: 640px;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,.6);
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      margin: 0 auto;
    }

    .player-container.is-fullscreen {
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      aspect-ratio: auto;
      border-radius: 0;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 9999;
    }

    .player-container > div:first-child,
    .player-container iframe {
      position: absolute;
      inset: 0;
      width: 100% !important;
      height: 100% !important;
      border: 0;
    }

    .brand-cover {
      position: absolute;
      left: 0;
      width: 100%;
      pointer-events: none;
      background: var(--bg);
      z-index: 4;
    }

    .brand-cover.top {
      top: 0;
      height: 40px;
    }

    .brand-cover.bottom {
      bottom: 0;
      height: 26px;
    }

    .pause-overlay {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.5);
      z-index: 6;
      backdrop-filter: blur(4px);
      cursor: pointer;
    }

    .pause-overlay.active {
      display: flex;
    }

    .pause-play-btn {
      background: var(--btn);
      border: none;
      color: var(--text-primary);
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
      cursor: pointer;
    }

    .pause-play-btn:hover {
      background: var(--btn-hover);
      transform: scale(1.1);
    }

    .pause-play-btn svg {
      width: 32px;
      height: 32px;
    }

    .controls-bar {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--controls-bg);
      backdrop-filter: blur(10px);
      z-index: 7;
      transition: opacity 0.3s ease, transform 0.3s ease;
      border-radius: 0 0 12px 12px;
    }

    .player-container.is-fullscreen .controls-bar {
      border-radius: 0;
    }

    .player-container.hide-ui .controls-bar {
      opacity: 0;
      transform: translateY(100%);
      pointer-events: none;
    }

    .controls-row {
      display: flex;
      flex-direction: column;
      padding: 8px 16px 12px;
      gap: 8px;
    }

    .progress-container {
      width: 100%;
      order: 2;
    }

    .progress-container.mobile-top {
      order: 1;
      margin-bottom: 4px;
    }

    .button-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      order: 1;
    }

    .progress-container.mobile-top + .button-controls {
      order: 2;
    }

    .control-btn {
      background: var(--btn);
      border: none;
      color: var(--text-primary);
      padding: 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      cursor: pointer;
      min-width: 44px;
      min-height: 44px;
      backdrop-filter: blur(10px);
    }

    .control-btn:hover {
      background: var(--btn-hover);
      transform: scale(1.05);
    }

    .control-btn:active {
      transform: scale(0.95);
    }

    .control-btn svg {
      width: 20px;
      height: 20px;
    }

    .seek {
      width: 100%;
      height: 6px;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(75, 85, 99, 0.8);
      border-radius: 3px;
      outline: none;
      margin: 0;
    }

    .seek::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: transform 0.2s ease;
    }

    .seek::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }

    .seek::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--accent);
      border: 2px solid white;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .time {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      user-select: none;
      white-space: nowrap;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }

    .spacer {
      flex: 1;
    }

    /* Mobile Styles */
    @media (max-width: 768px) {
      .player-container {
        border-radius: 8px;
      }

      .player-container.is-mobile {
        width: 100%;
        border-radius: 0;
      }

      .controls-row {
        padding: 12px 20px 16px;
        gap: 12px;
      }

      .button-controls {
        gap: 16px;
      }

      .control-btn {
        min-width: 48px;
        min-height: 48px;
        padding: 12px;
        border-radius: 12px;
      }

      .control-btn svg {
        width: 24px;
        height: 24px;
      }

      .pause-play-btn {
        width: 100px;
        height: 100px;
      }

      .pause-play-btn svg {
        width: 40px;
        height: 40px;
      }

      .seek {
        height: 8px;
        border-radius: 4px;
      }

      .seek::-webkit-slider-thumb {
        width: 20px;
        height: 20px;
        border: 3px solid white;
      }

      .seek::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border: 3px solid white;
      }

      .time {
        font-size: 16px;
      }

      .brand-cover.top {
        height: 30px;
      }

      .brand-cover.bottom {
        height: 20px;
      }
    }

    /* Extra small screens */
    @media (max-width: 480px) {
      .controls-row {
        padding: 10px 16px 14px;
        gap: 10px;
      }

      .button-controls {
        gap: 12px;
      }

      .control-btn {
        min-width: 44px;
        min-height: 44px;
        padding: 10px;
      }

      .control-btn svg {
        width: 20px;
        height: 20px;
      }

      .time {
        font-size: 14px;
      }
    }

    /* Landscape orientation on mobile */
    @media (max-height: 500px) and (orientation: landscape) {
      .controls-row {
        padding: 6px 16px 8px;
        gap: 6px;
      }

      .control-btn {
        min-width: 40px;
        min-height: 40px;
        padding: 8px;
      }

      .control-btn svg {
        width: 18px;
        height: 18px;
      }

      .pause-play-btn {
        width: 70px;
        height: 70px;
      }

      .pause-play-btn svg {
        width: 28px;
        height: 28px;
      }

      .seek {
        height: 6px;
      }

      .time {
        font-size: 12px;
      }
    }

    /* High DPI displays */
    @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
      .control-btn {
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    }

    /* Focus styles for accessibility */
    .control-btn:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    .seek:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* Animation for smooth transitions */
    .player-container * {
      transition: all 0.2s ease;
    }

    .player-container.hide-ui * {
      transition: all 0.3s ease;
    }

    @media (max-width: 768px) {
  .player-container .controls-bar {
    margin-bottom: 12px;
  }
}
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
  private touchTimer!: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadYT();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.raf);
    }
    clearTimeout(this.hideUITimer);
    clearTimeout(this.touchTimer);
    if (this.player?.destroy) this.player.destroy();
  }

  private loadYT(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (window.YT?.Player) { this.initPlayer(); return; }
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(script);
    window.onYouTubeIframeAPIReady = () => this.initPlayer();
  }

  private initPlayer(): void {
    this.player = new window.YT.Player(this.playerHost.nativeElement, {
      videoId: this.videoId,
      playerVars: { 
        controls: 0, 
        rel: 0, 
        modestbranding: 1, 
        showinfo: 0, 
        fs: 1, 
        playsinline: 1, 
        iv_load_policy: 3,
        disablekb: 1,
        cc_load_policy: 0,
      },
      events: { 
        onReady: () => this.onReady(), 
        onStateChange: (e: any) => this.onState(e) 
      }
    });
  }

  private onReady(): void {
    this.duration = this.player.getDuration();
    this.timeText = `0:00 / ${this.fmt(this.duration)}`;
    this.cdr.markForCheck();
    this.updateLoop();
  }

  togglePlay(): void { 
    (this.paused) ? this.player.playVideo() : this.player.pauseVideo(); 
  }

  toggleMute(): void { 
    this.muted = !this.muted; 
    this.muted ? this.player.mute() : this.player.unMute(); 
    this.cdr.markForCheck(); 
  }

  onSeek(e: Event): void { 
    this.player.seekTo(+(<HTMLInputElement>e.target).value, true); 
  }

  // toggleFullscreen(): void {
  //   const el = this.containerRef.nativeElement;
  //   if (!document.fullscreenElement) {
  //     (el.requestFullscreen || (<any>el).webkitRequestFullscreen || (<any>el).msRequestFullscreen).call(el);
  //   } else {
  //     (document.exitFullscreen || (<any>document).webkitExitFullscreen || (<any>document).msExitFullscreen).call(document);
  //   }
  // }

  toggleFullscreen(): void {
  const el = this.containerRef.nativeElement as any;

  if (!document.fullscreenElement &&
      !document.fullscreenElement &&
      !document.fullscreenElement) {
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen(); // Safari
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen(); // IE11
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }
}


  onContainerClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.controls-bar') && !target.closest('.pause-overlay')) {
      if (this.isMobile()) {
        this.showUI();
      } else {
        this.togglePlay();
      }
    }
  }

  onTouch(): void {
    this.showUI();
    // Double-tap prevention
    clearTimeout(this.touchTimer);
    this.touchTimer = setTimeout(() => {
      // Touch ended
    }, 300);
  }

  @HostListener('document:fullscreenchange') onFS(): void {
    this.isFullscreen = !!document.fullscreenElement;
    this.adjustSize();
    this.showUI();
    this.cdr.markForCheck();
  }

  @HostListener('window:resize') onResize(): void { 
    if (this.isFullscreen) this.adjustSize(); 
    this.cdr.markForCheck();
  }

  @HostListener('window:orientationchange') onOrientationChange(): void {
    setTimeout(() => {
      if (this.isFullscreen) this.adjustSize();
      this.cdr.markForCheck();
    }, 100);
  }

  private adjustSize(): void {
    if (!this.player?.setSize) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.player.setSize(w, h);
  }

  private onState(e: any): void {
    const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
    if (e.data === PLAYING) { this.paused = false; }
    if (e.data === PAUSED || e.data === ENDED) { this.paused = true; }
    this.showUI();
    this.cdr.markForCheck();
  }

  private updateLoop(): void {
    if (this.player?.getCurrentTime) {
      this.currentTime = this.player.getCurrentTime();
      this.timeText = `${this.fmt(this.currentTime)} / ${this.fmt(this.duration)}`;
    }
    this.raf = requestAnimationFrame(() => this.updateLoop());
  }

  showUI(): void {
    this.uiHidden = false;
    clearTimeout(this.hideUITimer);

    if (!this.isMobile()) {
      this.hideUITimer = setTimeout(() => {
        if (!this.paused) {
          this.uiHidden = true;
          this.cdr.markForCheck();
        }
      }, 3000);
    } else {
      // On mobile, hide UI after longer delay
      this.hideUITimer = setTimeout(() => {
        if (!this.paused) {
          this.uiHidden = true;
          this.cdr.markForCheck();
        }
      }, 4000);
    }
    this.cdr.markForCheck();
  }

  hideUI(): void {
    if (!this.isMobile() && !this.paused) {
      this.uiHidden = true;
      this.cdr.markForCheck();
    }
  }

  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  private fmt(sec: number): string {
    sec = Math.floor(sec);
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }
}