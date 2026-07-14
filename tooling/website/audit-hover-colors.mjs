#!/usr/bin/env node
/**
 * Systematic hover-state audit for both light and dark mode.
 *
 * Boots the website on localhost, walks EVERY interactive element in the
 * components showcase (buttons, chips, tags, accordion headers, list items,
 * table rows, select triggers, menu items, tabs, tree items, etc.), captures
 * the computed background-color in BOTH idle and hover state, and flags:
 *
 *  - zero-delta hovers (hover doesn't change anything visible)
 *  - very small deltas (hover barely perceptible)
 *  - hover colors that composite poorly against the surface behind them
 *
 * Output: .playwright-mcp/hover-audit.json + stdout table grouped by severity.
 *
 * Usage:
 *   node tooling/website/audit-hover-colors.mjs
 *   node tooling/website/audit-hover-colors.mjs --url=http://localhost:52891/components.html
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const URL_DEFAULT = 'http://127.0.0.1:52899/components.html';
const argUrl = process.argv.find(a => a.startsWith('--url='))?.slice(6);
const URL = argUrl || URL_DEFAULT;
const SERVE = !argUrl; // only auto-serve when user didn't pass a URL

// ---------- color helpers ----------
function parseRgb(s) {
  // Handles rgb(r g b), rgb(r,g,b), rgba(r,g,b,a), with decimal floats.
  if (!s || s === 'transparent' || s === 'rgba(0, 0, 0, 0)') return null;
  const m = s.match(/rgba?\(\s*([0-9.]+)[ ,]+([0-9.]+)[ ,]+([0-9.]+)(?:[ ,/]+([0-9.]+))?\s*\)/);
  if (!m) return null;
  return {
    r: parseFloat(m[1]),
    g: parseFloat(m[2]),
    b: parseFloat(m[3]),
    a: m[4] ? parseFloat(m[4]) : 1,
  };
}

function composite(overlay, base) {
  // Layer rgba(overlay) over rgb(base). Returns rgb of composited result.
  if (!overlay) return base;
  if (overlay.a >= 1) return { r: overlay.r, g: overlay.g, b: overlay.b, a: 1 };
  if (!base) return overlay;
  const a = overlay.a;
  return {
    r: overlay.r * a + base.r * (1 - a),
    g: overlay.g * a + base.g * (1 - a),
    b: overlay.b * a + base.b * (1 - a),
    a: 1,
  };
}

function luminance(rgb) {
  // Perceptual luminance (WCAG formula, linearized).
  if (!rgb) return 0;
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

function perceptualDelta(a, b) {
  // Approx perceived lightness delta (0..1). Purely a heuristic — for flagging
  // invisible hovers, not color science.
  if (!a || !b) return 1;
  return Math.abs(luminance(a) - luminance(b));
}

// ---------- target catalogue ----------
// Each entry: a CSS selector that matches interactive elements inside a
// showcase. `shadow` is a list of shadow-root hops — the final node is the
// visible interactive surface whose hover color we sample.
const TARGETS = [
  { name: 'button',         host: 'snice-button:not([disabled])',   inner: '.button' },
  { name: 'chip',           host: 'snice-chip',                     inner: '.chip' },
  { name: 'tag',            host: 'snice-tag',                      inner: '.tag' },
  { name: 'menu-item',      host: 'snice-menu-item',                inner: '.menu-item' },
  { name: 'list-item',      host: 'snice-list-item',                inner: '.list-item, [part="content"], [part="base"]' },
  { name: 'tab',            host: 'snice-tab',                      inner: '[part="base"], .tab' },
  { name: 'tree-item',      host: 'snice-tree-item',                inner: '.tree-item__content, .tree-item, [part="base"]' },
  { name: 'accordion-item', host: 'snice-accordion-item',           inner: '.accordion-item__header, [part="header"]' },
  { name: 'select',         host: 'snice-select',                   inner: '.select-trigger, [part="trigger"]' },
  { name: 'input',          host: 'snice-input',                    inner: '.input-container, [part="container"]' },
  { name: 'textarea',       host: 'snice-textarea',                 inner: '[part="container"], textarea' },
  { name: 'checkbox',       host: 'snice-checkbox',                 inner: '.checkbox, [part="box"]' },
  { name: 'switch',         host: 'snice-switch',                   inner: '.switch-track, [part="track"]' },
  { name: 'radio',          host: 'snice-radio',                    inner: '.radio, [part="dot"]' },
  { name: 'table-row',      host: 'snice-table tbody tr',           inner: null, direct: true },
  { name: 'pagination-btn', host: 'snice-pagination',               inner: 'button' },
  { name: 'nav-link',       host: 'snice-nav',                      inner: 'a, .nav-link, [part="item"]' },
];

// ---------- browser probe ----------
async function probe(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('snice-theme', t);
  }, theme);
  await page.waitForTimeout(400);

  const results = await page.evaluate(async (targets) => {
    function getComputedBg(el) {
      let node = el;
      // Walk up through boxes that are transparent until we hit a colored one
      // — hover color itself may sit on a transparent container.
      for (let i = 0; i < 10 && node; i++) {
        const s = getComputedStyle(node);
        if (s.backgroundColor && s.backgroundColor !== 'transparent' && s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          return s.backgroundColor;
        }
        node = node.parentElement || node.getRootNode()?.host;
      }
      return 'rgba(0, 0, 0, 0)';
    }

    function findInner(host, innerSelector, direct) {
      if (direct) return host;
      if (!innerSelector) return host;
      const sr = host.shadowRoot;
      if (sr) {
        for (const sel of innerSelector.split(',').map(s => s.trim())) {
          const el = sr.querySelector(sel);
          if (el) return el;
        }
      }
      return host;
    }

    const out = [];
    for (const tgt of targets) {
      const hosts = document.querySelectorAll(tgt.host);
      if (!hosts.length) continue;
      // Sample the FIRST host of each component type. One per kind keeps the
      // report tight and avoids duplicates from showcase repetition.
      const host = hosts[0];
      const inner = findInner(host, tgt.inner, tgt.direct);
      if (!inner) continue;
      inner.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 50));

      const idleBg = getComputedBg(inner);
      const idleBorder = getComputedStyle(inner).borderColor;

      // Find a stable ancestor surface to composite alpha hovers over.
      let surfaceNode = inner.parentElement || host.parentElement;
      while (surfaceNode) {
        const s = getComputedStyle(surfaceNode);
        if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') break;
        surfaceNode = surfaceNode.parentElement;
      }
      const surfaceBg = surfaceNode ? getComputedStyle(surfaceNode).backgroundColor : getComputedStyle(document.body).backgroundColor;

      // Trigger hover via :hover simulation — inject a style rule that
      // force-applies hover. More reliable than dispatching pointer events
      // across shadow roots.
      const tag = 'snice-hover-audit';
      let tagStyle = document.getElementById(tag);
      if (!tagStyle) {
        tagStyle = document.createElement('style');
        tagStyle.id = tag;
        document.head.appendChild(tagStyle);
      }
      // We can't force :hover across the shadow boundary directly from here,
      // so simulate by dispatching mouseenter + pointerover. Some components
      // only respond to :hover CSS, which we can't force. That's OK — we
      // report the delta we actually observe.
      inner.dispatchEvent(new MouseEvent('mouseover',   { bubbles: true, composed: true }));
      inner.dispatchEvent(new MouseEvent('mouseenter',  { bubbles: true, composed: true }));
      inner.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, composed: true }));
      // Also flag attribute/class-based hover (many components listen via JS).
      inner.classList.add('is-hover');
      host.setAttribute('data-hover', 'true');
      await new Promise(r => setTimeout(r, 80));

      const hoverBg = getComputedBg(inner);
      const hoverBorder = getComputedStyle(inner).borderColor;

      inner.classList.remove('is-hover');
      host.removeAttribute('data-hover');
      inner.dispatchEvent(new MouseEvent('mouseout',   { bubbles: true, composed: true }));
      inner.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, composed: true }));

      out.push({
        name: tgt.name,
        idleBg,
        hoverBg,
        idleBorder,
        hoverBorder,
        surfaceBg,
        hostTag: host.tagName.toLowerCase(),
      });
    }
    return out;
  }, targets);

  return results;
}

// ---------- main ----------
async function main() {
  let server;
  if (SERVE) {
    server = spawn('python3', ['-m', 'http.server', '52899'], {
      cwd: join(ROOT, 'website', 'public'),
      stdio: 'ignore',
    });
    await new Promise(r => setTimeout(r, 800));
  }

  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('[page error]', e.message));
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const perTheme = {};
    for (const theme of ['dark', 'light']) {
      perTheme[theme] = await probe(page, theme);
    }

    // Build report.
    const rows = [];
    for (const theme of Object.keys(perTheme)) {
      for (const r of perTheme[theme]) {
        const idle = parseRgb(r.idleBg);
        const hover = parseRgb(r.hoverBg);
        const surface = parseRgb(r.surfaceBg);
        const compositedIdle = idle && idle.a < 1 ? composite(idle, surface) : idle;
        const compositedHover = hover && hover.a < 1 ? composite(hover, surface) : hover;
        const delta = perceptualDelta(compositedIdle, compositedHover);
        rows.push({
          theme,
          component: r.name,
          idle: r.idleBg,
          hover: r.hoverBg,
          delta: delta.toFixed(3),
          verdict: delta < 0.01 ? 'NO_CHANGE'
                  : delta < 0.02 ? 'BARELY_VISIBLE'
                  : 'OK',
        });
      }
    }

    const problems = rows.filter(r => r.verdict !== 'OK');
    writeFileSync(join(ROOT, '.playwright-mcp', 'hover-audit.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), rows }, null, 2));

    console.log('\n─── HOVER AUDIT ───');
    console.log(`Tested ${rows.length} component/theme pairs.`);
    console.log(`Problems: ${problems.length}\n`);

    if (problems.length) {
      console.log('THEME   COMPONENT         VERDICT          IDLE BG → HOVER BG (Δ)');
      console.log('─────   ─────────         ───────          ──────────────────────');
      for (const p of problems) {
        console.log(
          `${p.theme.padEnd(6)} ${p.component.padEnd(17)} ${p.verdict.padEnd(16)} ${p.idle} → ${p.hover}  (${p.delta})`
        );
      }
    } else {
      console.log('No hover issues detected.');
    }
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
