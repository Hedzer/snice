import { element, property, dispatch, ready, dispose, render, styles, watch, html, css as cssTag } from 'snice';
import cssContent from './snice-countdown.css?inline';
import type { CountdownFormat, CountdownValues, CountdownVariant, SniceCountdownElement } from './snice-countdown.types';

@element('snice-countdown')
export class SniceCountdown extends HTMLElement implements SniceCountdownElement {
  @property()
  target = '';

  @property()
  format: CountdownFormat = 'dhms';

  @property()
  variant: CountdownVariant = 'simple';

  private timer: ReturnType<typeof setInterval> | null = null;
  private completed = false;

  @property({ type: Number }) private days = 0;
  @property({ type: Number }) private hours = 0;
  @property({ type: Number }) private minutes = 0;
  @property({ type: Number }) private seconds = 0;

  @dispatch('countdown-complete', { bubbles: true, composed: true, dispatchOnUndefined: true })
  private emitComplete() {
    return undefined;
  }

  @dispatch('countdown-tick', { bubbles: true, composed: true })
  private emitTick(): CountdownValues {
    return { days: this.days, hours: this.hours, minutes: this.minutes, seconds: this.seconds, total: this.getRemaining() };
  }

  @watch('target')
  onTargetChanged() {
    this.completed = false;
    this.restartTimer();
  }

  @ready()
  init() {
    this.restartTimer();
  }

  private restartTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  @dispose()
  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private getRemaining(): number {
    if (!this.target) return 0;
    const targetDate = new Date(this.target).getTime();
    return Math.max(0, targetDate - Date.now());
  }

  private tick() {
    const remaining = this.getRemaining();

    if (remaining <= 0 && !this.completed) {
      this.completed = true;
      this.days = 0;
      this.hours = 0;
      this.minutes = 0;
      this.seconds = 0;
      this.classList.add('complete');
      this.emitComplete();
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      return;
    }

    const totalSeconds = Math.floor(remaining / 1000);
    this.days = Math.floor(totalSeconds / 86400);
    this.hours = Math.floor((totalSeconds % 86400) / 3600);
    this.minutes = Math.floor((totalSeconds % 3600) / 60);
    this.seconds = totalSeconds % 60;
    this.emitTick();
  }

  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  @render()
  template() {
    const segments: Array<{ value: string; label: string }> = [];

    if (this.format === 'dhms') {
      segments.push({ value: this.pad(this.days), label: 'Days' });
    }
    if (this.format === 'dhms' || this.format === 'hms') {
      segments.push({ value: this.pad(this.hours), label: 'Hours' });
    }
    segments.push({ value: this.pad(this.minutes), label: 'Min' });
    segments.push({ value: this.pad(this.seconds), label: 'Sec' });

    const items = segments.map((seg, i) => {
      const showSep = i < segments.length - 1;
      return html`
        <div part="segment" class="segment">
          <span part="value" class="value">${seg.value}</span>
          <span part="label" class="label">${seg.label}</span>
        </div>
        <if ${showSep}><span part="separator" class="separator">:</span></if>
      `;
    });

    return html`<div part="base" class="countdown">${items}</div>`;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
