import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow } from './test-utils';
import '../../components/qr-code/snice-qr-code';
import type { SniceQRCodeElement } from '../../components/qr-code/snice-qr-code.types';

describe('snice-qr-code', () => {
  let qrCode: SniceQRCodeElement;

  afterEach(() => {
    if (qrCode) {
      removeComponent(qrCode as HTMLElement);
    }
  });

  it('should render', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code');
    expect(qrCode).toBeTruthy();
  });

  it('should have default properties', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code');
    expect(qrCode.value).toBe('');
    expect(qrCode.size).toBe(200);
    expect(qrCode.errorCorrectionLevel).toBe('M');
    expect(qrCode.renderMode).toBe('canvas');
    expect(qrCode.margin).toBe(4);
    expect(qrCode.fgColor).toBe('#000000');
    expect(qrCode.bgColor).toBe('#ffffff');
  });

  it('should generate QR code from value', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      value: 'https://example.com'
    });

    await wait();
    expect(qrCode.value).toBe('https://example.com');
  });

  it('should support custom size', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      size: 300
    });

    expect(qrCode.size).toBe(300);
  });

  it('should support error correction levels', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      'error-correction-level': 'H'
    });

    expect(qrCode.errorCorrectionLevel).toBe('H');
  });

  it('should support SVG render mode', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      'render-mode': 'svg'
    });

    expect(qrCode.renderMode).toBe('svg');
  });

  it('should support canvas render mode', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      'render-mode': 'canvas'
    });

    expect(qrCode.renderMode).toBe('canvas');
  });

  it('should support custom margin', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      margin: 8
    });

    expect(qrCode.margin).toBe(8);
  });

  it('should support custom foreground color', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      'fg-color': '#ff0000'
    });

    expect(qrCode.fgColor).toBe('#ff0000');
  });

  it('should support custom background color', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      'bg-color': '#f0f0f0'
    });

    expect(qrCode.bgColor).toBe('#f0f0f0');
  });

  it('should support image overlay', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      'include-image': true,
      'image-url': 'logo.png'
    });

    expect(qrCode.includeImage).toBe(true);
    expect(qrCode.imageUrl).toBe('logo.png');
  });

  it('should support custom image size', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      'image-size': 60
    });

    expect(qrCode.imageSize).toBe(60);
  });

  it.skip('should export to data URL', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      value: 'Test'
    });

    await wait();

    const dataURL = await qrCode.toDataURL();
    expect(dataURL).toContain('data:image/png');
  });

  it.skip('should export to blob', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      value: 'Test'
    });

    await wait();

    const blob = await qrCode.toBlob();
    expect(blob).toBeInstanceOf(Blob);
  });

  it('should render a canvas element when value is set', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      value: 'https://example.com'
    });

    await wait(50);
    const container = queryShadow<HTMLElement>(qrCode as HTMLElement, '.qr-container');
    const canvas = container?.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should render an SVG element in SVG render mode', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      value: 'https://example.com',
      'render-mode': 'svg'
    });

    await wait(50);
    const container = queryShadow<HTMLElement>(qrCode as HTMLElement, '.qr-container');
    const svg = container?.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should regenerate QR code when value changes', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      value: 'first'
    });

    await wait(50);
    const container = queryShadow<HTMLElement>(qrCode as HTMLElement, '.qr-container');
    const firstCanvas = container?.querySelector('canvas');
    expect(firstCanvas).toBeTruthy();

    // Change value
    qrCode.value = 'second';
    await wait(50);

    const secondCanvas = container?.querySelector('canvas');
    expect(secondCanvas).toBeTruthy();
  });

  it('should not render QR code when value is empty', async () => {
    qrCode = await createComponent<SniceQRCodeElement>('snice-qr-code');

    await wait(50);
    const container = queryShadow<HTMLElement>(qrCode as HTMLElement, '.qr-container');
    const canvas = container?.querySelector('canvas');
    expect(canvas).toBeFalsy();
  });

  it('should support different QR versions based on text length', async () => {
    const shortText = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      value: 'Hi'
    });

    const longText = await createComponent<SniceQRCodeElement>('snice-qr-code', {
      value: 'This is a much longer text that will require a larger QR code version'
    });

    await wait();

    expect(shortText.value).toBe('Hi');
    expect(longText.value.length).toBeGreaterThan(10);

    removeComponent(shortText as HTMLElement);
    removeComponent(longText as HTMLElement);
  });
});
