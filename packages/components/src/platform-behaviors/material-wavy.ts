/**
 * Android Material 3 Expressive Wavy Progress SVG engine (lazy-loaded on demand
 * by platform-behaviors/material.ts; 0 B in non-Material builds and 0 B loaded
 * by Material apps that don't use progress/spinner elements).
 *
 * Implements 1:1 AOSP WavyProgressIndicatorDefaults:
 * 1. LinearWavyProgressIndicator (snice-progress linear):
 *    - Bounded SVG <path stroke-linecap="round"> with genuine semicircular caps
 *    - 40dp (40px) wavelength flowing at 40px/s across all sizes (>=1px AA headroom)
 *    - Smooth AOSP defaultAmplitude ramp to flat at 0% & 100%
 *    - Crisp 4dp track gaps + concentric trailing stop dot
 *    - Indeterminate 2-segment variable-length wavy sweep with gapped flat tracks
 * 2. CircularWavyProgressIndicator (snice-progress circular, snice-progress-ring, snice-spinner):
 *    - Seamless C2-continuous sinusoidal radial modulation r(theta) = R + A*sin(N*theta - phase)
 *    - Genuine semicircular round caps + 4px angular gap to smooth secondary-container track
 *    - Smooth AOSP defaultAmplitude ramp to smooth circle at 0% & 100%
 *    - Continuous 270deg/1333ms M3 indeterminate sweep + 4000ms rotation (zero cycle jump)
 */
import { prefersReducedMotion, type PlatformBehaviorCleanup } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const TOP_ANGLE = -Math.PI / 2;
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
  const k = TAU / wavelength;
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

function buildCircularArc(
  cx: number,
  cy: number,
  R: number,
  a0: number,
  a1: number
): string {
  const span = a1 - a0;
  if (span <= 0.002) return '';
  if (span >= TAU - 0.002) {
    return `M${f2(cx + R)} ${f2(cy)}A${f2(R)} ${f2(R)} 0 1 1 ${f2(cx - R)} ${f2(cy)}A${f2(R)} ${f2(R)} 0 1 1 ${f2(cx + R)} ${f2(cy)}`;
  }
  const x0 = cx + R * Math.cos(a0);
  const y0 = cy + R * Math.sin(a0);
  const x1 = cx + R * Math.cos(a1);
  const y1 = cy + R * Math.sin(a1);
  const largeArc = span > Math.PI ? 1 : 0;
  return `M${f2(x0)} ${f2(y0)}A${f2(R)} ${f2(R)} 0 ${largeArc} 1 ${f2(x1)} ${f2(y1)}`;
}

function buildCircularWaveArc(
  cx: number,
  cy: number,
  R: number,
  amp: number,
  lobes: number,
  a0: number,
  a1: number,
  phaseRad: number
): string {
  const span = a1 - a0;
  if (span <= 0.002) return '';
  if (amp <= 0.05) {
    return buildCircularArc(cx, cy, R, a0, a1);
  }
  const steps = Math.max(16, Math.ceil((span / TAU) * lobes * 14));
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const theta = i === steps ? a1 : a0 + (span * i) / steps;
    const rad = R + amp * Math.sin(lobes * theta - phaseRad);
    const x = cx + rad * Math.cos(theta);
    const y = cy + rad * Math.sin(theta);
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

function clearWaveSvg(svg: SVGSVGElement | null): void {
  if (!svg) return;
  svg.textContent = '';
  svg.removeAttribute('viewBox');
  svg.style.width = '';
  svg.style.height = '';
}

function ensureWaveNodes(svg: SVGSVGElement, trackStroke: string, activeStroke: string) {
  let [trackPath, activePath, stopDot] = svg.children as unknown as [
    SVGPathElement | undefined,
    SVGPathElement | undefined,
    SVGCircleElement | undefined,
  ];
  if (!trackPath || !activePath || !stopDot) {
    svg.textContent = '';
    trackPath = document.createElementNS(SVG_NS, 'path');
    trackPath.setAttribute('fill', 'none');
    trackPath.setAttribute('stroke', trackStroke);
    trackPath.setAttribute('stroke-linecap', 'round');

    activePath = document.createElementNS(SVG_NS, 'path');
    activePath.setAttribute('fill', 'none');
    activePath.setAttribute('stroke', activeStroke);
    activePath.setAttribute('stroke-linecap', 'round');
    activePath.setAttribute('stroke-linejoin', 'round');

    stopDot = document.createElementNS(SVG_NS, 'circle');
    stopDot.setAttribute('fill', activeStroke);

    svg.append(trackPath, activePath, stopDot);
  }
  return { trackPath, activePath, stopDot };
}

function drawCircularWavy(
  svg: SVGSVGElement,
  elapsedMs: number,
  reduced: boolean,
  opts: {
    indeterminate: boolean;
    progress: number;
    sizePx: number;
    stroke: number;
    trackStroke: string;
    activeStroke: string;
  }
): boolean {
  const { trackPath, activePath, stopDot } = ensureWaveNodes(
    svg,
    opts.trackStroke,
    opts.activeStroke
  );
  stopDot.style.display = 'none';

  const S = Math.max(20, Math.round(opts.sizePx));
  const stroke = clamp(opts.stroke, 1.5, S * 0.22);
  const amp = S <= 34 ? 1.15 : S <= 44 ? 1.5 : S <= 64 ? 1.75 : S <= 104 ? 2.4 : 3.2;
  const cx = S / 2;
  const cy = S / 2;
  // >= 1px AA headroom around outer wave crests
  const R = Math.max(4, S / 2 - stroke / 2 - amp - 1);
  // Integer lobe count N guarantees C2 continuity around full loop (~22px arc wavelength)
  const lobes = Math.max(6, Math.round((TAU * R) / 22));
  // Visual 4px gap between round-cap ends = (stroke + gap) / R radians
  const gap = S <= 30 ? 3 : 4;
  const gapAngle = (stroke + gap) / R;

  const vb = `0 0 ${S} ${S}`;
  if (svg.getAttribute('viewBox') !== vb) svg.setAttribute('viewBox', vb);
  // Let CSS control rendered box dimensions so dynamic size attribute updates work seamlessly
  if (svg.style.width) svg.style.width = '';
  if (svg.style.height) svg.style.height = '';
  trackPath.setAttribute('stroke-width', f2(stroke));
  activePath.setAttribute('stroke-width', f2(stroke));

  const phaseRad = reduced ? 0 : ((elapsedMs / 1000) * 1.2 * TAU) % TAU;

  let trackD = '';
  let activeD = '';
  let keepAnimating = false;

  if (opts.indeterminate) {
    if (reduced) {
      const a0 = TOP_ANGLE;
      const a1 = TOP_ANGLE + 0.62 * TAU;
      activeD = buildCircularWaveArc(cx, cy, R, amp, lobes, a0, a1, 0);
      const t0 = a1 + gapAngle;
      const t1 = a0 + TAU - gapAngle;
      if (t1 > t0) trackD = buildCircularArc(cx, cy, R, t0, t1);
    } else {
      // 1:1 AOSP CircularWavyProgressIndicator: matched 270deg cycle delta & sweep -> zero teleport jump
      const sweepDelta = (270 * Math.PI) / 180;
      const baseRot = ((elapsedMs % 4000) / 4000) * TAU;
      const cycleIdx = Math.floor(elapsedMs / 1333);
      const cycleU = (elapsedMs % 1333) / 1333;
      const stepOffset = cycleIdx * sweepDelta;
      const head = cubicEase(0.4, 0, 0.2, 1, Math.min(1, cycleU / 0.5)) * sweepDelta;
      const tail = cycleU < 0.5 ? 0 : cubicEase(0.4, 0, 0.2, 1, (cycleU - 0.5) / 0.5) * sweepDelta;
      const minArc = (36 * Math.PI) / 180;
      const a0 = TOP_ANGLE + baseRot + stepOffset + tail;
      const a1 = TOP_ANGLE + baseRot + stepOffset + head + minArc;

      activeD = buildCircularWaveArc(cx, cy, R, amp, lobes, a0, a1, phaseRad);
      const t0 = a1 + gapAngle;
      const t1 = a0 + TAU - gapAngle;
      if (t1 > t0) trackD = buildCircularArc(cx, cy, R, t0, t1);
      keepAnimating = true;
    }
  } else {
    const p = clamp(opts.progress, 0, 1);
    if (p <= 0) {
      trackD = buildCircularArc(cx, cy, R, 0, TAU);
    } else if (p >= 1) {
      activeD = buildCircularArc(cx, cy, R, 0, TAU);
    } else {
      const effectiveAmp = amp * aospAmplitudeFactor(p);
      const sweep = Math.max(0.02, p * TAU);
      const a0 = TOP_ANGLE;
      const a1 = a0 + sweep;
      activeD = buildCircularWaveArc(cx, cy, R, effectiveAmp, lobes, a0, a1, phaseRad);
      const t0 = a1 + gapAngle;
      const t1 = a0 + TAU - gapAngle;
      if (t1 > t0) trackD = buildCircularArc(cx, cy, R, t0, t1);
      keepAnimating = !reduced && effectiveAmp > 0.05;
    }
  }

  if (trackD) trackPath.setAttribute('d', trackD);
  else trackPath.removeAttribute('d');
  if (activeD) activePath.setAttribute('d', activeD);
  else activePath.removeAttribute('d');

  return keepAnimating;
}

function measureCircleSize(el: Element, fallback: number): number {
  const rect = el.getBoundingClientRect();
  const s = Math.min(rect.width || 0, rect.height || 0);
  return s >= 16 ? s : fallback;
}

export function attachWavyProgress(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};

  const tag = el.tagName.toLowerCase();
  const host = el as HTMLElement & {
    value?: number;
    max?: number;
    variant?: string;
    size?: string;
    thickness?: number;
    indeterminate?: boolean;
    striped?: boolean;
    getPercentage?: () => number;
  };

  let rafId = 0;
  let visible = true;
  const startTime = nowMs();

  const draw = (now: number): boolean => {
    const svg = root.querySelector<SVGSVGElement>('[part~="wave"]');
    if (!svg) {
      host.removeAttribute('data-m3-wavy');
      return false;
    }

    const reduced = prefersReducedMotion(host);
    const elapsedMs = reduced ? 0 : now - startTime;

    // 1. snice-progress-ring (CircularWavyProgressIndicator determinate)
    if (tag === 'snice-progress-ring') {
      host.setAttribute('data-m3-wavy', 'true');
      const sz = host.size || host.getAttribute('size') || 'medium';
      const fallback = sz === 'small' ? 48 : sz === 'large' ? 128 : 80;
      const sizePx = measureCircleSize(svg, fallback);
      const rawThick = Number(host.thickness ?? host.getAttribute('thickness') ?? 4);
      const stroke = clamp((rawThick / 36) * sizePx * 0.45, 1.5, 12);
      const maxVal = Math.max(1e-6, Number(host.max ?? host.getAttribute('max') ?? 100));
      const val = Number(host.value ?? host.getAttribute('value') ?? 0);
      return drawCircularWavy(svg, elapsedMs, reduced, {
        indeterminate: false,
        progress: clamp(val / maxVal, 0, 1),
        sizePx,
        stroke,
        trackStroke: 'var(--_m3-wave-track, var(--snice-m3-secondary-container))',
        activeStroke: 'var(--_m3-wave-active, var(--progress-ring-color, var(--snice-color-primary)))',
      });
    }

    // 2. snice-spinner (CircularWavyProgressIndicator indeterminate on default 'arc' variant)
    if (tag === 'snice-spinner') {
      const variant = host.variant || host.getAttribute('variant') || 'arc';
      if (variant !== 'arc') {
        host.removeAttribute('data-m3-wavy');
        clearWaveSvg(svg);
        return false;
      }
      host.setAttribute('data-m3-wavy', 'true');
      const sz = host.size || host.getAttribute('size') || 'medium';
      const fallback = sz === 'small' ? 24 : sz === 'large' ? 48 : sz === 'xl' ? 72 : 40;
      const defaultStroke = sz === 'small' ? 3 : sz === 'large' ? 4.5 : sz === 'xl' ? 6 : 4;
      const hasCustomThick = host.hasAttribute('thickness') || (typeof host.thickness === 'number' && host.thickness !== 4);
      const stroke = hasCustomThick ? Number(host.thickness ?? host.getAttribute('thickness') ?? defaultStroke) : defaultStroke;
      const sizePx = measureCircleSize(svg, fallback);
      return drawCircularWavy(svg, elapsedMs, reduced, {
        indeterminate: true,
        progress: 0,
        sizePx,
        stroke,
        trackStroke: 'var(--_m3-wave-track, var(--snice-m3-secondary-container))',
        activeStroke: 'var(--_m3-wave-active, var(--spinner-color, var(--snice-color-primary)))',
      });
    }

    // 3. snice-progress (linear OR circular)
    const variant = host.variant || host.getAttribute('variant') || 'linear';
    const striped = Boolean(host.striped) || host.hasAttribute('striped');
    if (variant === 'circular') {
      host.setAttribute('data-m3-wavy', 'true');
      const sz = host.size || host.getAttribute('size') || 'medium';
      const fallback =
        sz === 'small' ? 24 : sz === 'large' ? 56 : sz === 'xl' ? 80 : sz === 'xxl' ? 120 : sz === 'xxxl' ? 160 : 40;
      const defaultStroke =
        sz === 'small' ? 3 : sz === 'large' ? 5 : sz === 'xl' ? 6 : sz === 'xxl' ? 8 : sz === 'xxxl' ? 10 : 4;
      const hasCustomThick = host.hasAttribute('thickness') || (typeof host.thickness === 'number' && host.thickness !== 4);
      const stroke = hasCustomThick ? Number(host.thickness ?? host.getAttribute('thickness') ?? defaultStroke) : defaultStroke;
      const sizePx = measureCircleSize(svg, fallback);
      const pct =
        typeof host.getPercentage === 'function'
          ? host.getPercentage()
          : clamp((Number(host.value ?? 0) / Math.max(1e-6, Number(host.max ?? 100))) * 100, 0, 100);
      return drawCircularWavy(svg, elapsedMs, reduced, {
        indeterminate: Boolean(host.indeterminate) || host.hasAttribute('indeterminate'),
        progress: pct / 100,
        sizePx,
        stroke,
        trackStroke: 'var(--_m3-wave-track, var(--snice-m3-secondary-container))',
        activeStroke: 'var(--_m3-wave-active, var(--progress-color, var(--snice-color-primary)))',
      });
    }

    if (striped) {
      host.removeAttribute('data-m3-wavy');
      clearWaveSvg(svg);
      return false;
    }

    // LinearWavyProgressIndicator
    host.setAttribute('data-m3-wavy', 'true');
    const { trackPath, activePath, stopDot } = ensureWaveNodes(
      svg,
      'var(--_m3-wave-track, var(--snice-m3-secondary-container))',
      'var(--_m3-wave-active, var(--progress-color, var(--snice-color-primary)))'
    );

    const sz = host.size || host.getAttribute('size') || 'medium';
    const wavelength = 40;
    const gap = 4;
    const [stroke, amp, h] =
      sz === 'small' ? [3, 2.25, 10] : sz === 'medium' ? [4, 3, 12] : [6, 4, 16];
    const r = stroke / 2;
    const midY = h / 2;
    const W = Math.max(stroke * 2, Math.round(svg.getBoundingClientRect().width) || 240);

    const vb = `0 0 ${W} ${h}`;
    if (svg.getAttribute('viewBox') !== vb) svg.setAttribute('viewBox', vb);
    svg.style.width = '100%';
    svg.style.height = `${h}px`;
    trackPath.setAttribute('stroke-width', String(stroke));
    activePath.setAttribute('stroke-width', String(stroke));

    const phasePx = reduced ? 0 : ((elapsedMs / 1000) * wavelength) % wavelength;

    let trackD = '';
    let activeD = '';
    let showStop = false;
    let keepAnimating = false;

    if (Boolean(host.indeterminate) || host.hasAttribute('indeterminate')) {
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
    attributeFilter: ['value', 'max', 'variant', 'size', 'thickness', 'indeterminate', 'striped', 'color'],
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
    clearWaveSvg(root.querySelector<SVGSVGElement>('[part~="wave"]'));
    host.removeEventListener('progress-change', schedule);
    attrMo?.disconnect();
    shadowMo?.disconnect();
    docMo?.disconnect();
    ro?.disconnect();
    io?.disconnect();
  };
}
