import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import { renderIcon } from '../../components/utils';
import '../../components/button/snice-button';
import '../../components/chip/snice-chip';
import '../../components/input/snice-input';
import '../../components/empty-state/snice-empty-state';
import type { SniceButtonElement } from '../../components/button/snice-button.types';
import type { SniceChipElement } from '../../components/chip/snice-chip.types';
import type { SniceInputElement } from '../../components/input/snice-input.types';
import type { SniceEmptyStateElement } from '../../components/empty-state/snice-empty-state.types';

// Helper to check if result renders as img
function rendersAsImg(result: ReturnType<typeof renderIcon>): boolean {
  return result.strings[0].trim().startsWith('<img');
}

// Helper to check if result renders as span (for HTML or text)
function rendersAsSpan(result: ReturnType<typeof renderIcon>): boolean {
  return result.strings[0].trim().startsWith('<span');
}

describe('renderIcon utility', () => {
  describe('empty input', () => {
    it('should return empty template for empty string', () => {
      const result = renderIcon('');
      expect(result).toBeTruthy();
      expect(result.strings.join('')).toBe('');
    });

    it('should return empty template for undefined-like values', () => {
      const result = renderIcon('');
      expect(result.strings.join('')).toBe('');
    });
  });

  describe('URL auto-detection', () => {
    it('should detect absolute paths starting with /', () => {
      const paths = [
        '/icon.svg',
        '/icons/home.svg',
        '/assets/images/icon.png',
        '/a/b/c/d/icon.jpg'
      ];
      for (const path of paths) {
        expect(rendersAsImg(renderIcon(path))).toBe(true);
      }
    });

    it('should detect relative paths starting with ./', () => {
      const paths = [
        './icon.svg',
        './icons/home.png',
        './assets/test.gif'
      ];
      for (const path of paths) {
        expect(rendersAsImg(renderIcon(path))).toBe(true);
      }
    });

    it('should detect parent directory paths starting with ../', () => {
      const paths = [
        '../icon.svg',
        '../icons/home.png',
        '../../assets/test.gif',
        '../../../deep/path/icon.webp'
      ];
      for (const path of paths) {
        expect(rendersAsImg(renderIcon(path))).toBe(true);
      }
    });

    it('should detect https:// URLs', () => {
      const urls = [
        'https://example.com/icon.svg',
        'https://cdn.example.com/assets/icon.png',
        'https://example.com/api/icon?size=24'
      ];
      for (const url of urls) {
        expect(rendersAsImg(renderIcon(url))).toBe(true);
      }
    });

    it('should detect http:// URLs', () => {
      const urls = [
        'http://example.com/icon.svg',
        'http://localhost:3000/icon.png'
      ];
      for (const url of urls) {
        expect(rendersAsImg(renderIcon(url))).toBe(true);
      }
    });

    it('should detect data: URLs', () => {
      const dataUrls = [
        'data:image/svg+xml,<svg></svg>',
        'data:image/png;base64,iVBORw0KGgo=',
        'data:image/gif;base64,R0lGODlh'
      ];
      for (const url of dataUrls) {
        expect(rendersAsImg(renderIcon(url))).toBe(true);
      }
    });
  });

  describe('file extension auto-detection', () => {
    it('should detect .svg files', () => {
      expect(rendersAsImg(renderIcon('icon.svg'))).toBe(true);
      expect(rendersAsImg(renderIcon('ICON.SVG'))).toBe(true);
      expect(rendersAsImg(renderIcon('my-icon.svg'))).toBe(true);
    });

    it('should detect .png files', () => {
      expect(rendersAsImg(renderIcon('icon.png'))).toBe(true);
      expect(rendersAsImg(renderIcon('ICON.PNG'))).toBe(true);
    });

    it('should detect .jpg and .jpeg files', () => {
      expect(rendersAsImg(renderIcon('photo.jpg'))).toBe(true);
      expect(rendersAsImg(renderIcon('photo.jpeg'))).toBe(true);
      expect(rendersAsImg(renderIcon('PHOTO.JPG'))).toBe(true);
      expect(rendersAsImg(renderIcon('PHOTO.JPEG'))).toBe(true);
    });

    it('should detect JPEG variants (.jfif, .pjp)', () => {
      expect(rendersAsImg(renderIcon('photo.jfif'))).toBe(true);
      expect(rendersAsImg(renderIcon('photo.pjp'))).toBe(true);
    });

    it('should detect .gif files', () => {
      expect(rendersAsImg(renderIcon('animation.gif'))).toBe(true);
      expect(rendersAsImg(renderIcon('ANIMATION.GIF'))).toBe(true);
    });

    it('should detect .webp files', () => {
      expect(rendersAsImg(renderIcon('image.webp'))).toBe(true);
      expect(rendersAsImg(renderIcon('IMAGE.WEBP'))).toBe(true);
    });

    it('should detect .avif files', () => {
      expect(rendersAsImg(renderIcon('image.avif'))).toBe(true);
      expect(rendersAsImg(renderIcon('IMAGE.AVIF'))).toBe(true);
    });

    it('should detect .jxl (JPEG XL) files', () => {
      expect(rendersAsImg(renderIcon('image.jxl'))).toBe(true);
      expect(rendersAsImg(renderIcon('IMAGE.JXL'))).toBe(true);
    });

    it('should detect .ico and .cur files', () => {
      expect(rendersAsImg(renderIcon('favicon.ico'))).toBe(true);
      expect(rendersAsImg(renderIcon('cursor.cur'))).toBe(true);
    });

    it('should detect .bmp files', () => {
      expect(rendersAsImg(renderIcon('image.bmp'))).toBe(true);
      expect(rendersAsImg(renderIcon('IMAGE.BMP'))).toBe(true);
    });

    it('should detect .tif and .tiff files', () => {
      expect(rendersAsImg(renderIcon('image.tif'))).toBe(true);
      expect(rendersAsImg(renderIcon('image.tiff'))).toBe(true);
    });

    it('should detect .heic and .heif files', () => {
      expect(rendersAsImg(renderIcon('photo.heic'))).toBe(true);
      expect(rendersAsImg(renderIcon('photo.heif'))).toBe(true);
    });

    it('should detect .apng files', () => {
      expect(rendersAsImg(renderIcon('animation.apng'))).toBe(true);
    });

    it('should NOT detect non-image extensions as images', () => {
      expect(rendersAsImg(renderIcon('file.txt'))).toBe(false);
      expect(rendersAsImg(renderIcon('script.js'))).toBe(false);
      expect(rendersAsImg(renderIcon('style.css'))).toBe(false);
      expect(rendersAsImg(renderIcon('data.json'))).toBe(false);
      expect(rendersAsImg(renderIcon('doc.pdf'))).toBe(false);
      expect(rendersAsImg(renderIcon('archive.zip'))).toBe(false);
    });
  });

  describe('HTML auto-detection', () => {
    it('should detect SVG elements', () => {
      const svgs = [
        '<svg></svg>',
        '<svg viewBox="0 0 24 24"></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'
      ];
      for (const svg of svgs) {
        expect(rendersAsSpan(renderIcon(svg))).toBe(true);
      }
    });

    it('should detect span elements (font icons)', () => {
      const spans = [
        '<span class="material-symbols">home</span>',
        '<span class="fa fa-home"></span>',
        '<span class="icon-home"></span>'
      ];
      for (const span of spans) {
        expect(rendersAsSpan(renderIcon(span))).toBe(true);
      }
    });

    it('should detect i elements (font icons)', () => {
      const iElements = [
        '<i class="fa fa-home"></i>',
        '<i class="material-icons">home</i>',
        '<i class="bi bi-house"></i>'
      ];
      for (const i of iElements) {
        expect(rendersAsSpan(renderIcon(i))).toBe(true);
      }
    });

    it('should handle HTML with leading whitespace', () => {
      expect(rendersAsSpan(renderIcon('  <svg></svg>'))).toBe(true);
      expect(rendersAsSpan(renderIcon('\n<span>icon</span>'))).toBe(true);
      expect(rendersAsSpan(renderIcon('\t<i class="fa"></i>'))).toBe(true);
    });

    it('should detect other HTML elements', () => {
      expect(rendersAsSpan(renderIcon('<div>icon</div>'))).toBe(true);
      expect(rendersAsSpan(renderIcon('<img src="x">'))).toBe(true);
      expect(rendersAsSpan(renderIcon('<b>B</b>'))).toBe(true);
    });
  });

  describe('text auto-detection (fallback)', () => {
    it('should render emoji as text', () => {
      const emojis = ['🏠', '⭐', '✓', '→', '❤️', '🎉', '📧', '⚙️'];
      for (const emoji of emojis) {
        expect(rendersAsSpan(renderIcon(emoji))).toBe(true);
      }
    });

    it('should render font ligature names as text', () => {
      const ligatures = [
        'home',
        'settings',
        'arrow_forward',
        'check_circle',
        'favorite',
        'search'
      ];
      for (const ligature of ligatures) {
        expect(rendersAsSpan(renderIcon(ligature))).toBe(true);
      }
    });

    it('should render unicode symbols as text', () => {
      const symbols = ['★', '●', '▶', '◀', '■', '□', '♠', '♣'];
      for (const symbol of symbols) {
        expect(rendersAsSpan(renderIcon(symbol))).toBe(true);
      }
    });

    it('should render arbitrary text as text', () => {
      expect(rendersAsSpan(renderIcon('X'))).toBe(true);
      expect(rendersAsSpan(renderIcon('OK'))).toBe(true);
      expect(rendersAsSpan(renderIcon('123'))).toBe(true);
    });
  });

  describe('scheme overrides', () => {
    describe('img:// scheme', () => {
      it('should force image rendering for bare filenames', () => {
        expect(rendersAsImg(renderIcon('img://icon.svg'))).toBe(true);
        expect(rendersAsImg(renderIcon('img://photo.png'))).toBe(true);
      });

      it('should force image rendering for text that looks like ligatures', () => {
        expect(rendersAsImg(renderIcon('img://home'))).toBe(true);
        expect(rendersAsImg(renderIcon('img://settings'))).toBe(true);
      });

      it('should force image rendering for paths', () => {
        expect(rendersAsImg(renderIcon('img:///icons/home.svg'))).toBe(true);
        expect(rendersAsImg(renderIcon('img://./local/icon.png'))).toBe(true);
      });

      it('should strip img:// prefix from src', () => {
        const result = renderIcon('img://test.svg', 'icon');
        expect(result.strings.join('')).toContain('src="');
        expect(result.strings.join('')).not.toContain('img://');
      });
    });

    describe('text:// scheme', () => {
      it('should force text rendering for HTML-like strings', () => {
        const result = renderIcon('text://<not-html>', 'icon');
        expect(rendersAsSpan(result)).toBe(true);
      });

      it('should force text rendering for path-like strings', () => {
        const result = renderIcon('text:///path/to/something', 'icon');
        expect(rendersAsSpan(result)).toBe(true);
        // Should NOT render as img
        expect(rendersAsImg(renderIcon('text:///path/to/something'))).toBe(false);
      });

      it('should force text rendering for URL-like strings', () => {
        const result = renderIcon('text://https://example.com', 'icon');
        expect(rendersAsSpan(result)).toBe(true);
        expect(rendersAsImg(result)).toBe(false);
      });

      it('should strip text:// prefix from content', () => {
        const result = renderIcon('text://hello', 'icon');
        expect(result.strings.join('')).not.toContain('text://');
      });

      it('should render the actual content as text', () => {
        // text:// prefix should be stripped, content rendered as-is
        const result = renderIcon('text://<script>alert(1)</script>', 'icon');
        expect(rendersAsSpan(result)).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle strings that look like URLs but are not', () => {
      // These don't match URL patterns and don't have image extensions
      expect(rendersAsSpan(renderIcon('example.com/icon'))).toBe(true);
      expect(rendersAsSpan(renderIcon('ftp://server/file'))).toBe(true);
    });

    it('should handle filenames with multiple dots', () => {
      expect(rendersAsImg(renderIcon('icon.min.svg'))).toBe(true);
      expect(rendersAsImg(renderIcon('my.icon.file.png'))).toBe(true);
    });

    it('should handle special characters in paths', () => {
      expect(rendersAsImg(renderIcon('/path/to/my-icon_v2.svg'))).toBe(true);
      expect(rendersAsImg(renderIcon('./icons/icon%20name.png'))).toBe(true);
    });

    it('should handle query strings in URLs', () => {
      expect(rendersAsImg(renderIcon('/icon.svg?v=123'))).toBe(true);
      expect(rendersAsImg(renderIcon('https://example.com/icon?size=24'))).toBe(true);
    });

    it('should handle hash fragments in URLs', () => {
      expect(rendersAsImg(renderIcon('/sprite.svg#icon-home'))).toBe(true);
    });

    it('should apply custom className', () => {
      const result = renderIcon('🏠', 'custom-class');
      // className is interpolated as a value, check values array
      expect(result.values).toContain('custom-class');
    });

    it('should apply default className', () => {
      const result = renderIcon('🏠');
      // Default className is 'icon'
      expect(result.values).toContain('icon');
    });

    it('should include part="icon" for styling', () => {
      const imgResult = renderIcon('/icon.svg');
      const spanResult = renderIcon('home');
      // part is static in the template
      expect(imgResult.strings.join('')).toContain('part="icon"');
      expect(spanResult.strings.join('')).toContain('part="icon"');
    });
  });

  describe('comprehensive auto-detection matrix', () => {
    // Test all combinations to ensure correct detection priority

    describe('URL patterns take priority', () => {
      it('should detect / paths even with text-like names', () => {
        expect(rendersAsImg(renderIcon('/home'))).toBe(true);
        expect(rendersAsImg(renderIcon('/settings'))).toBe(true);
        expect(rendersAsImg(renderIcon('/star'))).toBe(true);
      });

      it('should detect ./ paths even with text-like names', () => {
        expect(rendersAsImg(renderIcon('./home'))).toBe(true);
        expect(rendersAsImg(renderIcon('./arrow'))).toBe(true);
      });

      it('should detect ../ paths even with text-like names', () => {
        expect(rendersAsImg(renderIcon('../home'))).toBe(true);
        expect(rendersAsImg(renderIcon('../../star'))).toBe(true);
      });

      it('should detect URLs even without file extensions', () => {
        expect(rendersAsImg(renderIcon('https://api.example.com/icon/home'))).toBe(true);
        expect(rendersAsImg(renderIcon('http://localhost:3000/generate-icon'))).toBe(true);
      });
    });

    describe('file extension detection', () => {
      it('should detect images with mixed case extensions', () => {
        expect(rendersAsImg(renderIcon('icon.Svg'))).toBe(true);
        expect(rendersAsImg(renderIcon('icon.sVg'))).toBe(true);
        expect(rendersAsImg(renderIcon('icon.SVG'))).toBe(true);
        expect(rendersAsImg(renderIcon('icon.Png'))).toBe(true);
        expect(rendersAsImg(renderIcon('icon.PNG'))).toBe(true);
      });

      it('should NOT detect partial extension matches', () => {
        expect(rendersAsSpan(renderIcon('mysvg'))).toBe(true);
        expect(rendersAsSpan(renderIcon('pngfile'))).toBe(true);
        expect(rendersAsSpan(renderIcon('svg'))).toBe(true);
        expect(rendersAsSpan(renderIcon('png'))).toBe(true);
      });

      it('should detect extensions at end only', () => {
        expect(rendersAsImg(renderIcon('file.svg'))).toBe(true);
        expect(rendersAsSpan(renderIcon('svg.file'))).toBe(true);
        expect(rendersAsSpan(renderIcon('.svg'))).toBe(true);
      });
    });

    describe('HTML detection with whitespace', () => {
      it('should detect HTML with various whitespace', () => {
        expect(rendersAsSpan(renderIcon(' <svg></svg>'))).toBe(true);
        expect(rendersAsSpan(renderIcon('  <svg></svg>'))).toBe(true);
        expect(rendersAsSpan(renderIcon('\t<svg></svg>'))).toBe(true);
        expect(rendersAsSpan(renderIcon('\n<svg></svg>'))).toBe(true);
        expect(rendersAsSpan(renderIcon('\r\n<svg></svg>'))).toBe(true);
        expect(rendersAsSpan(renderIcon('   \t\n  <svg></svg>'))).toBe(true);
      });

      it('should NOT detect HTML that does not start with <', () => {
        expect(rendersAsSpan(renderIcon('svg<>'))).toBe(true);
        expect(rendersAsSpan(renderIcon('a<b'))).toBe(true);
        expect(rendersAsSpan(renderIcon('test<svg>'))).toBe(true);
      });
    });
  });

  describe('comprehensive scheme override tests', () => {
    describe('img:// scheme comprehensive', () => {
      it('should override text detection', () => {
        // Without scheme, these would be text
        expect(rendersAsSpan(renderIcon('home'))).toBe(true);
        // With scheme, they become images
        expect(rendersAsImg(renderIcon('img://home'))).toBe(true);
      });

      it('should override HTML detection', () => {
        // Without scheme, this would be HTML
        expect(rendersAsSpan(renderIcon('<svg></svg>'))).toBe(true);
        // With scheme, it becomes an image (weird but allowed)
        expect(rendersAsImg(renderIcon('img://<svg></svg>'))).toBe(true);
      });

      it('should work with already-URL content', () => {
        expect(rendersAsImg(renderIcon('img:///path/icon.svg'))).toBe(true);
        expect(rendersAsImg(renderIcon('img://https://example.com/icon.png'))).toBe(true);
      });

      it('should handle empty content after scheme', () => {
        const result = renderIcon('img://', 'icon');
        expect(rendersAsImg(result)).toBe(true);
        expect(result.strings.join('')).toContain('src=""');
      });

      it('should preserve special characters in src', () => {
        const result = renderIcon('img://path/to/icon?v=1&size=24#hash', 'icon');
        expect(rendersAsImg(result)).toBe(true);
      });
    });

    describe('text:// scheme comprehensive', () => {
      it('should override URL detection', () => {
        expect(rendersAsImg(renderIcon('/path/icon.svg'))).toBe(true);
        expect(rendersAsSpan(renderIcon('text:///path/icon.svg'))).toBe(true);
        expect(rendersAsImg(renderIcon('text:///path/icon.svg'))).toBe(false);
      });

      it('should override file extension detection', () => {
        expect(rendersAsImg(renderIcon('icon.svg'))).toBe(true);
        expect(rendersAsSpan(renderIcon('text://icon.svg'))).toBe(true);
        expect(rendersAsImg(renderIcon('text://icon.svg'))).toBe(false);
      });

      it('should override HTML detection', () => {
        expect(rendersAsSpan(renderIcon('<svg></svg>'))).toBe(true);
        // text:// also renders as span, but content is escaped not parsed
        expect(rendersAsSpan(renderIcon('text://<svg></svg>'))).toBe(true);
      });

      it('should handle potentially dangerous content safely', () => {
        // The text:// scheme should render as plain text, not execute HTML
        const result = renderIcon('text://<script>alert(1)</script>', 'icon');
        expect(rendersAsSpan(result)).toBe(true);
        // Content is interpolated as text, not unsafeHTML
      });

      it('should handle empty content after scheme', () => {
        const result = renderIcon('text://', 'icon');
        expect(rendersAsSpan(result)).toBe(true);
      });

      it('should handle emojis with scheme', () => {
        expect(rendersAsSpan(renderIcon('text://🏠'))).toBe(true);
      });

      it('should handle ligature names with scheme', () => {
        expect(rendersAsSpan(renderIcon('text://home'))).toBe(true);
        expect(rendersAsSpan(renderIcon('text://arrow_forward'))).toBe(true);
      });
    });

    describe('scheme edge cases', () => {
      it('should be case-sensitive for schemes', () => {
        // Only lowercase schemes work
        expect(rendersAsImg(renderIcon('img://icon.svg'))).toBe(true);
        expect(rendersAsSpan(renderIcon('IMG:icon.svg'))).toBe(true); // Not recognized as scheme
        expect(rendersAsSpan(renderIcon('Img:icon.svg'))).toBe(true); // Not recognized as scheme
      });

      it('should not match partial scheme names', () => {
        expect(rendersAsSpan(renderIcon('image:icon.svg'))).toBe(true); // Not img://
        expect(rendersAsSpan(renderIcon('txt:icon.svg'))).toBe(true); // Not text://
      });

      it('should handle scheme with colon in content', () => {
        // First colon is scheme delimiter, rest is content
        expect(rendersAsImg(renderIcon('img://http://example.com/icon.png'))).toBe(true);
      });

      it('should handle scheme-like patterns that are not at start', () => {
        // img:// in middle should not be treated as scheme
        expect(rendersAsSpan(renderIcon('prefix-img://icon'))).toBe(true);
        expect(rendersAsSpan(renderIcon('some img://text'))).toBe(true);
      });
    });
  });

  describe('real-world usage scenarios', () => {
    it('should handle Material Symbols font ligatures', () => {
      const materialIcons = [
        'home', 'settings', 'search', 'menu', 'close', 'add', 'delete',
        'edit', 'save', 'arrow_back', 'arrow_forward', 'check', 'clear',
        'favorite', 'star', 'person', 'mail', 'phone', 'location_on'
      ];
      for (const icon of materialIcons) {
        expect(rendersAsSpan(renderIcon(icon))).toBe(true);
      }
    });

    it('should handle Font Awesome class-based icons', () => {
      const faIcons = [
        '<i class="fa fa-home"></i>',
        '<i class="fas fa-user"></i>',
        '<i class="far fa-heart"></i>',
        '<i class="fab fa-github"></i>'
      ];
      for (const icon of faIcons) {
        expect(rendersAsSpan(renderIcon(icon))).toBe(true);
      }
    });

    it('should handle Bootstrap Icons', () => {
      const bsIcons = [
        '<i class="bi bi-house"></i>',
        '<i class="bi bi-gear"></i>',
        '<i class="bi bi-search"></i>'
      ];
      for (const icon of bsIcons) {
        expect(rendersAsSpan(renderIcon(icon))).toBe(true);
      }
    });

    it('should handle inline SVG icons', () => {
      const svgIcons = [
        '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10"/></svg>'
      ];
      for (const icon of svgIcons) {
        expect(rendersAsSpan(renderIcon(icon))).toBe(true);
      }
    });

    it('should handle CDN image URLs', () => {
      const cdnUrls = [
        'https://cdn.example.com/icons/home.svg',
        'https://img.icons8.com/ios/50/000000/home.png',
        'https://fonts.gstatic.com/s/i/materialicons/home/v6/24px.svg'
      ];
      for (const url of cdnUrls) {
        expect(rendersAsImg(renderIcon(url))).toBe(true);
      }
    });

    it('should handle local asset paths', () => {
      const localPaths = [
        '/assets/icons/home.svg',
        '/static/img/icon.png',
        './images/icon.gif',
        '../shared/icons/star.webp'
      ];
      for (const path of localPaths) {
        expect(rendersAsImg(renderIcon(path))).toBe(true);
      }
    });

    it('should handle common emoji icons', () => {
      const emojis = [
        '🏠', '⚙️', '🔍', '📧', '📱', '💾', '🗑️', '✏️', '➕', '➖',
        '✓', '✗', '⭐', '❤️', '👤', '🔔', '📁', '📄', '🔗', '⬆️'
      ];
      for (const emoji of emojis) {
        expect(rendersAsSpan(renderIcon(emoji))).toBe(true);
      }
    });
  });
});

describe('button icon rendering', () => {
  let button: SniceButtonElement;

  afterEach(() => {
    if (button) {
      removeComponent(button as HTMLElement);
    }
  });

  it('should render emoji icon', async () => {
    button = await createComponent<SniceButtonElement>('snice-button', { icon: '🔍' });

    const iconEl = queryShadow(button as HTMLElement, '.icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.textContent).toContain('🔍');
  });

  it('should render text icon (for font ligatures)', async () => {
    button = await createComponent<SniceButtonElement>('snice-button', { icon: 'home' });

    const iconEl = queryShadow(button as HTMLElement, '.icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.textContent).toContain('home');
  });

  it('should render URL icon as img', async () => {
    button = await createComponent<SniceButtonElement>('snice-button', { icon: '/icons/test.svg' });

    const iconEl = queryShadow(button as HTMLElement, '.icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.tagName.toLowerCase()).toBe('img');
  });

  it('should update icon when property changes', async () => {
    button = await createComponent<SniceButtonElement>('snice-button', { icon: '🔍' });

    const tracker = trackRenders(button as HTMLElement);
    button.icon = '🏠';
    await tracker.next();

    const iconEl = queryShadow(button as HTMLElement, '.icon');
    expect(iconEl?.textContent).toContain('🏠');
  });
});

describe('chip icon rendering', () => {
  let chip: SniceChipElement;

  afterEach(() => {
    if (chip) {
      removeComponent(chip as HTMLElement);
    }
  });

  it('should render emoji icon', async () => {
    chip = await createComponent<SniceChipElement>('snice-chip', { label: 'Test', icon: '★' });

    const iconEl = queryShadow(chip as HTMLElement, '.chip-icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.textContent).toContain('★');
  });

  it('should render URL icon as img', async () => {
    chip = await createComponent<SniceChipElement>('snice-chip', { label: 'Test', icon: '/icons/star.svg' });

    const iconEl = queryShadow(chip as HTMLElement, '.chip-icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.tagName.toLowerCase()).toBe('img');
  });
});

describe('input icon rendering', () => {
  let input: SniceInputElement;

  afterEach(() => {
    if (input) {
      removeComponent(input as HTMLElement);
    }
  });

  it('should render prefix emoji icon', async () => {
    input = await createComponent<SniceInputElement>('snice-input', { 'prefix-icon': '🔍' });

    const iconEl = queryShadow(input as HTMLElement, '.icon--prefix');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.textContent).toContain('🔍');
  });

  it('should render suffix emoji icon', async () => {
    input = await createComponent<SniceInputElement>('snice-input', { 'suffix-icon': '✓' });

    const iconEl = queryShadow(input as HTMLElement, '.icon--suffix');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.textContent).toContain('✓');
  });

  it('should render prefix URL icon as img', async () => {
    input = await createComponent<SniceInputElement>('snice-input', { 'prefix-icon': '/icons/search.svg' });

    const iconEl = queryShadow(input as HTMLElement, '.icon--prefix');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.tagName.toLowerCase()).toBe('img');
  });

  it('should render font ligature text', async () => {
    input = await createComponent<SniceInputElement>('snice-input', { 'prefix-icon': 'search' });

    const iconEl = queryShadow(input as HTMLElement, '.icon--prefix');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.textContent).toContain('search');
  });
});

describe('empty-state icon rendering', () => {
  let emptyState: SniceEmptyStateElement;

  afterEach(() => {
    if (emptyState) {
      removeComponent(emptyState as HTMLElement);
    }
  });

  it('should render default emoji icon', async () => {
    emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state');

    const iconEl = queryShadow(emptyState as HTMLElement, '.empty-state__icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.textContent).toContain('📭');
  });

  it('should render custom emoji icon', async () => {
    emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', { icon: '🔍' });

    const iconEl = queryShadow(emptyState as HTMLElement, '.empty-state__icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.textContent).toContain('🔍');
  });

  it('should render URL icon as img', async () => {
    emptyState = await createComponent<SniceEmptyStateElement>('snice-empty-state', { icon: '/icons/empty.svg' });

    const iconEl = queryShadow(emptyState as HTMLElement, '.empty-state__icon');
    expect(iconEl).toBeTruthy();
    expect(iconEl?.tagName.toLowerCase()).toBe('img');
  });
});
