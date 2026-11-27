/**
 * Android Material 3 Expressive Wavy Progress SVG engine (lazy-loaded on demand
 * by platform-behaviors/material.ts; 0 B in non-Material builds and 0 B loaded
 * by Material apps that don't use progress/spinner elements).
 *
 * Implements 1:1 AOSP WavyProgressIndicatorDefaults (LinearWavyProgressIndicator):
 * - Bounded SVG <path stroke-linecap="round"> with genuine semicircular round caps
 * - 40dp (40px) wavelength flowing at 40px/s across all sizes (>=1px AA headroom)
 * - Smooth AOSP defaultAmplitude ramp to flat at 0% & 100%
 * - Crisp 4dp track gaps and concentric trailing stop indicator dot
 * - Indeterminate 2-segment variable-length wavy sweep with gapped flat track segments
 */
import { prefersReducedMotion, type PlatformBehaviorCleanup } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const f2 = (n: number) => n.toFixed(2);

function cubicEase(x1: number, y1: number, x2: number, y2: number, rawT: number): number {
  const t = clamp(rawT, 0, 1);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  let u = t;
  for (let i = 0; i < 6; i++) {
    const inv = 1 - u;
    const x = 3 * inv * inv * u * x1 + 3 * inv * u * u * x2 + u * u * u;
    const dx = 3 * inv * inv * x1 + 6 * inv * u * (x2 - x1) + 3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u = clamp(u - (x - t) / dx, 0, 1);
  }
  const inv = 1 - u;
  return 3 * inv * inv * u * y1 + 3 * inv * u * u * y2 + u * u * u;
}

function buildSineSubpath(
  x0: number,
  x1: number,
  midY: number,
  amp: number,
  wavelength: number,
  phasePx: number
): string {
  const k = (Math.PI * 2) / wavelength;
  if (x1 <= x0 + 0.05) {
    const y = amp > 0.05 ? midY + amp * Math.sin((x0 - phasePx) * k) : midY;
    return `M${f2(x0)} ${f2(y)}L${f2(x0 + 0.05)} ${f2(y)}`;
  }
  if (amp <= 0.05) {
    return `M${f2(x0)} ${f2(midY)}L${f2(x1)} ${f2(midY)}`;
  }
  const span = x1 - x0;
  const count = Math.max(2, Math.ceil(span / 2));
  let d = '';
  for (let i = 0; i <= count; i++) {
    const x = i === count ? x1 : x0 + (span * i) / count;
    const y = midY + amp * Math.sin((x - phasePx) * k);
    d += (i ? 'L' : 'M') + f2(x) + ' ' + f2(y);
  }
  return d;
}

function aospAmplitudeFactor(progress: number): number {
  if (progress <= 0.02 || progress >= 0.999) return 0;
  if (progress < 0.1) return (progress - 0.02) / 0.08;
  if (progress > 0.92) return (1 - progress) / 0.08;
  return 1;
}

export function attachWavyProgress(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};

  const host = el as HTMLElement & {
    value?: number;
    max?: number;
    variant?: string;
    size?: string;
    indeterminate?: boolean;
    striped?: boolean;
    getPercentage?: () => number;
  };

  let rafId = 0;
  let visible = true;
  const startTime = nowMs();

  const ensureNodes = (svg: SVGSVGElement) => {
    let [trackPath, activePath, stopDot] = svg.children as unknown as [
      SVGPathElement | undefined,
      SVGPathElement | undefined,
      SVGCircleElement | undefined,
    ];
    if (!trackPath || !activePath || !stopDot) {
      svg.textContent = '';
      trackPath = document.createElementNS(SVG_NS, 'path');
      trackPath.setAttribute('fill', 'none');
      trackPath.setAttribute('stroke', 'var(--_m3-wave-track, var(--snice-m3-secondary-container))');
      trackPath.setAttribute('stroke-linecap', 'round');

      activePath = document.createElementNS(SVG_NS, 'path');
      activePath.setAttribute('fill', 'none');
      activePath.setAttribute('stroke', 'var(--_m3-wave-active, var(--progress-color, var(--snice-color-primary)))');
      activePath.setAttribute('stroke-linecap', 'round');
      activePath.setAttribute('stroke-linejoin', 'round');

      stopDot = document.createElementNS(SVG_NS, 'circle');
      stopDot.setAttribute('fill', 'var(--_m3-wave-active, var(--progress-color, var(--snice-color-primary)))');

      svg.append(trackPath, activePath, stopDot);
    }
    return { trackPath, activePath, stopDot };
  };

  const draw = (now: number): boolean => {
    const variant = host.variant || host.getAttribute('variant') || 'linear';
    const striped = Boolean(host.striped) || host.hasAttribute('striped');
    const svg =
      variant !== 'circular' && !striped
        ? root.querySelector<SVGSVGElement>('[part~="wave"]')
        : null;
    if (!svg) {
      host.removeAttribute('data-m3-wavy');
      return false;
    }

    host.setAttribute('data-m3-wavy', 'true');
    const { trackPath, activePath, stopDot } = ensureNodes(svg);

    const sz = host.size || host.getAttribute('size') || 'medium';
    const wavelength = 40;
    const gap = 4;
    const [stroke, amp, h] =
      sz === 'small'
        ? [3, 2.25, 10]
        : sz === 'medium'
          ? [4, 3, 12]
          : [6, 4, 16];
    const r = stroke / 2;
    const midY = h / 2;
    const W = Math.max(stroke * 2, Math.round(svg.getBoundingClientRect().width) || 240);

    const vb = `0 0 ${W} ${h}`;
    if (svg.getAttribute('viewBox') !== vb) svg.setAttribute('viewBox', vb);
    svg.style.height = `${h}px`;
    trackPath.setAttribute('stroke-width', String(stroke));
    activePath.setAttribute('stroke-width', String(stroke));

    const reduced = prefersReducedMotion(host);
    const elapsedMs = reduced ? 0 : now - startTime;
    const phasePx = reduced ? 0 : ((elapsedMs / 1000) * wavelength) % wavelength;

    let trackD = '';
    let activeD = '';
    let showStop = false;
    let keepAnimating = false;

    if (Boolean(host.indeterminate) || host.hasAttribute('indeterminate')) {
      // 1:1 AOSP 2-segment variable-length indeterminate sweep over 1800ms
      const u = reduced ? 0.34 : (elapsedMs % 1800) / 1800;
      const segs: Array<[number, number]> = [];
      const s1Head = cubicEase(0.2, 0, 0.8, 1, u / 0.417);
      const s1Tail = u < 0.185 ? 0 : cubicEase(0.4, 0, 1, 1, (u - 0.185) / 0.472);
      if (s1Head - s1Tail > 0.015) segs.push([s1Tail * W, s1Head * W]);

      const s2Head = u < 0.556 ? 0 : cubicEase(0, 0, 0.65, 1, (u - 0.556) / 0.333);
      const s2Tail = u < 0.704 ? 0 : cubicEase(0.1, 0, 0.45, 1, (u - 0.704) / 0.296);
      if (s2Head - s2Tail > 0.015) segs.push([s2Tail * W, s2Head * W]);

      segs.sort((a, b) => a[0] - b[0]);

      let cursor = 0;
      let padLeft = false;
      for (const [s0, s1] of segs) {
        const ax0 = clamp(s0 + r, r, W - r);
        const ax1 = clamp(s1 - r, ax0, W - r);
        activeD += buildSineSubpath(ax0, ax1, midY, amp, wavelength, phasePx);

        const g0 = padLeft ? cursor + gap : cursor;
        const g1 = ax0 - r - gap;
        if (g1 - g0 >= stroke) {
          trackD += `M${f2(g0 + r)} ${f2(midY)}L${f2(g1 - r)} ${f2(midY)}`;
        }
        cursor = Math.max(cursor, ax1 + r);
        padLeft = true;
      }
      const tailStart = padLeft ? cursor + gap : 0;
      if (W - tailStart >= stroke) {
        trackD += `M${f2(tailStart + r)} ${f2(midY)}L${f2(W - r)} ${f2(midY)}`;
      }
      keepAnimating = !reduced;
    } else {
      const pct =
        typeof host.getPercentage === 'function'
          ? host.getPercentage()
          : clamp((Number(host.value ?? 0) / Math.max(1e-6, Number(host.max ?? 100))) * 100, 0, 100);
      const p = pct / 100;

      if (p <= 0) {
        trackD = `M${f2(r)} ${f2(midY)}L${f2(W - r)} ${f2(midY)}`;
        showStop = true;
      } else if (p >= 1) {
        activeD = `M${f2(r)} ${f2(midY)}L${f2(W - r)} ${f2(midY)}`;
      } else {
        const effectiveAmp = amp * aospAmplitudeFactor(p);
        const ax1 = Math.max(r, clamp(p * W, stroke, W) - r);
        activeD = buildSineSubpath(r, ax1, midY, effectiveAmp, wavelength, phasePx);

        const trackStartVis = ax1 + r + gap;
        if (W - trackStartVis >= stroke) {
          trackD = `M${f2(trackStartVis + r)} ${f2(midY)}L${f2(W - r)} ${f2(midY)}`;
        }
        showStop = trackStartVis <= W - stroke;
        keepAnimating = !reduced && effectiveAmp > 0.05;
      }
    }

    if (trackD) trackPath.setAttribute('d', trackD);
    else trackPath.removeAttribute('d');

    if (activeD) activePath.setAttribute('d', activeD);
    else activePath.removeAttribute('d');

    stopDot.style.display = showStop ? '' : 'none';
    if (showStop) {
      stopDot.setAttribute('cx', f2(W - r));
      stopDot.setAttribute('cy', f2(midY));
      stopDot.setAttribute('r', f2(r));
    }
    return keepAnimating;
  };

  const stop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
  const tick = (t: number) => {
    rafId = 0;
    if (draw(t) && visible) rafId = requestAnimationFrame(tick);
  };
  const schedule = () => {
    stop();
    if (draw(nowMs()) && visible) rafId = requestAnimationFrame(tick);
  };

  host.addEventListener('progress-change', schedule);
  const attrMo =
    typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : null;
  attrMo?.observe(host, {
    attributes: true,
    attributeFilter: ['value', 'max', 'variant', 'size', 'indeterminate', 'striped', 'color'],
  });
  const shadowMo =
    typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : null;
  shadowMo?.observe(root, { childList: true, subtree: true });
  const docMo =
    typeof MutationObserver !== 'undefined' && typeof document !== 'undefined'
      ? new MutationObserver(schedule)
      : null;
  if (typeof document !== 'undefined') {
    docMo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
  ro?.observe(host);
  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
          visible = entries.some((e) => e.isIntersecting);
          if (visible) schedule();
          else stop();
        })
      : null;
  io?.observe(host);

  schedule();

  return () => {
    stop();
    host.removeAttribute('data-m3-wavy');
    host.removeEventListener('progress-change', schedule);
    attrMo?.disconnect();
    shadowMo?.disconnect();
    docMo?.disconnect();
    ro?.disconnect();
    io?.disconnect();
  };
}
