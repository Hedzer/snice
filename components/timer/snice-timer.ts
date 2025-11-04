import { element, property, render, styles, dispatch, html, css, query } from 'snice';
import type { TimerMode, SniceTimerElement } from './snice-timer.types';
import timerStyles from './snice-timer.css?inline';

@element('snice-timer')
export class SniceTimer extends HTMLElement implements SniceTimerElement {
  @property({ type: String })
  mode: TimerMode = 'stopwatch';

  @property({ type: Number, attribute: 'initial-time' })
  initialTime: number = 0;

  @property({ type: Boolean })
  running: boolean = false;

  @property({ type: Number })
  private time: number = 0;

  private animationFrame: number | null = null;
  private startTimestamp: number = 0;
  private pausedTime: number = 0;

  @query('.timer-display')
  private displayElement?: HTMLElement;

  @styles()
  styles() {
    return css/*css*/`${timerStyles}`;
  }

  @render()
  render() {
    return html/*html*/`
      <div class="timer-container">
        <div class="timer-display">${this.formatTime(this.time)}</div>
        <div class="timer-controls">
          <if ${!this.running}>
            <button class="timer-btn start" @click=${() => this.start()} title="Start">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </if>
          <if ${this.running}>
            <button class="timer-btn pause" @click=${() => this.stop()} title="Pause">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            </button>
          </if>
          <button class="timer-btn reset" @click=${() => this.reset()} title="Reset">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  start(): void {
    if (this.running) return;

    this.running = true;

    if (this.mode === 'stopwatch') {
      this.startTimestamp = Date.now() - (this.time * 1000);
    } else {
      this.startTimestamp = Date.now();
      this.pausedTime = this.time;
    }

    const tick = () => {
      if (!this.running) return;

      const elapsed = (Date.now() - this.startTimestamp) / 1000;

      if (this.mode === 'stopwatch') {
        this.time = elapsed;
      } else {
        this.time = Math.max(0, this.pausedTime - elapsed);

        if (this.time <= 0) {
          this.time = 0;
          if (this.displayElement) {
            this.displayElement.textContent = this.formatTime(this.time);
          }
          this.stop();
          this.emitTimerComplete();
          return;
        }
      }

      if (this.displayElement) {
        this.displayElement.textContent = this.formatTime(this.time);
      }

      this.animationFrame = requestAnimationFrame(tick);
    };

    this.animationFrame = requestAnimationFrame(tick);
    this.emitTimerStart();
  }

  stop(): void {
    if (!this.running) return;

    this.running = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.emitTimerStop();
  }

  reset(): void {
    this.stop();
    this.time = this.mode === 'timer' ? this.initialTime : 0;

    // Update display immediately
    if (this.displayElement) {
      this.displayElement.textContent = this.formatTime(this.time);
    }

    this.emitTimerReset();
  }

  getTime(): number {
    return this.time;
  }

  private formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  }

  @dispatch('timer-start', { bubbles: true, composed: true })
  private emitTimerStart() {
    return { timer: this, time: this.time };
  }

  @dispatch('timer-stop', { bubbles: true, composed: true })
  private emitTimerStop() {
    return { timer: this, time: this.time };
  }

  @dispatch('timer-reset', { bubbles: true, composed: true })
  private emitTimerReset() {
    return { timer: this, time: this.time };
  }

  @dispatch('timer-complete', { bubbles: true, composed: true })
  private emitTimerComplete() {
    return { timer: this };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-timer': SniceTimer;
  }
}
