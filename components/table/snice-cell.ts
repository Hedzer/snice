import { element, property, watch, ready, query, render, styles, html, css } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { 
  SniceCellElement, 
  ColumnType, 
  ColumnAlign, 
  ColumnDefinition,
  NumberFormat,
  DateFormat,
  BooleanFormat,
  RatingFormat,
  ProgressFormat,
  SparklineFormat,
  CellStyle,
  ConditionalFormat
} from './snice-table.types';

@element('snice-cell')
export class SniceCell extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'left';

  @property({  })
  type: ColumnType = 'text';

  @property()
  value: any = '';

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'text',
    align: 'left'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;

  @render()
  renderContent() {
    return html/*html*/`
      <div class="cell-content" part="content">
        ${this.formatValue()}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.applyAlignment();
    this.applyConditionalFormatting();
  }

  @watch('align')
  updateAlignment() {
    this.applyAlignment();
  }

  @watch('value', 'column')
  updateContent() {
    if (this.contentElement) {
      this.contentElement.innerHTML = this.formatValue();
    }
    this.applyConditionalFormatting();
  }

  private applyAlignment() {
    this.style.textAlign = this.align;
  }

  private applyConditionalFormatting() {
    if (!this.column || !this.column.conditionalFormats) return;

    // Reset any previous conditional formatting
    this.removeAttribute('style');
    this.className = 'snice-cell';
    this.applyAlignment();

    // Apply column base style if defined
    if (this.column.style) {
      this.applyStyle(this.column.style);
    }

    // Check and apply conditional formats
    for (const format of this.column.conditionalFormats) {
      if (format.condition(this.value, this.rowData)) {
        if (format.style) {
          this.applyStyle(format.style);
        }
        if (format.className) {
          this.classList.add(format.className);
        }
        break; // Apply only the first matching format
      }
    }
  }

  private applyStyle(style: CellStyle) {
    if (style.backgroundColor) this.style.backgroundColor = style.backgroundColor;
    if (style.color) this.style.color = style.color;
    if (style.fontWeight) this.style.fontWeight = style.fontWeight;
    if (style.fontStyle) this.style.fontStyle = style.fontStyle;
    if (style.fontSize) this.style.fontSize = style.fontSize;
    if (style.textDecoration) this.style.textDecoration = style.textDecoration;
  }

  private formatValue(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }

    // Use custom formatter if provided
    if (this.column.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    // Apply type-specific formatting
    switch (this.type) {
      case 'text':
        return this.formatText();
      case 'number':
        return this.formatNumber();
      case 'currency':
        return this.formatCurrency();
      case 'percent':
        return this.formatPercent();
      case 'accounting':
        return this.formatAccounting();
      case 'scientific':
        return this.formatScientific();
      case 'fraction':
        return this.formatFraction();
      case 'date':
        return this.formatDate();
      case 'boolean':
        return this.formatBoolean();
      case 'rating':
        return this.formatRating();
      case 'progress':
        return this.formatProgress();
      case 'sparkline':
        return this.formatSparkline();
      case 'duration':
        return this.formatDuration();
      case 'filesize':
        return this.formatFilesize();
      case 'custom':
        return String(this.value);
      default:
        return String(this.value);
    }
  }

  private formatText(): string {
    return String(this.value);
  }

  private formatNumber(): string {
    const format = this.column.numberFormat || {};
    const num = Number(this.value);
    
    if (isNaN(num)) return String(this.value);

    let formatted = num.toFixed(format.decimals ?? 0);
    
    if (format.thousandsSeparator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    if (num < 0 && format.negativeStyle === 'parentheses') {
      formatted = `(${formatted.replace('-', '')})`;
    }

    if (format.prefix) formatted = format.prefix + formatted;
    if (format.suffix) formatted = formatted + format.suffix;

    return formatted;
  }

  private formatCurrency(): string {
    const format = this.column.numberFormat || {};
    const num = Number(this.value);
    
    if (isNaN(num)) return String(this.value);

    const currencyFormat: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: format.decimals ?? 2,
      maximumFractionDigits: format.decimals ?? 2
    };

    return new Intl.NumberFormat('en-US', currencyFormat).format(num);
  }

  private formatPercent(): string {
    const format = this.column.numberFormat || {};
    const num = Number(this.value);
    
    if (isNaN(num)) return String(this.value);

    const percentFormat: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: format.decimals ?? 1,
      maximumFractionDigits: format.decimals ?? 1
    };

    return new Intl.NumberFormat('en-US', percentFormat).format(num);
  }

  private formatAccounting(): string {
    const format = this.column.numberFormat || {};
    const num = Number(this.value);
    
    if (isNaN(num)) return String(this.value);

    let formatted = Math.abs(num).toFixed(format.decimals ?? 2);
    
    if (format.thousandsSeparator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    if (num < 0) {
      formatted = `(${formatted})`;
    } else {
      formatted = ` ${formatted} `;
    }

    return formatted;
  }

  private formatScientific(): string {
    const format = this.column.numberFormat || {};
    const num = Number(this.value);
    
    if (isNaN(num)) return String(this.value);

    return num.toExponential(format.decimals ?? 2);
  }

  private formatFraction(): string {
    const num = Number(this.value);
    if (isNaN(num)) return String(this.value);

    // Simple fraction conversion
    const tolerance = 1e-6;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = num;
    
    do {
      const a = Math.floor(b);
      let aux = h1;
      h1 = a * h1 + h2;
      h2 = aux;
      aux = k1;
      k1 = a * k1 + k2;
      k2 = aux;
      b = 1 / (b - a);
    } while (Math.abs(num - h1 / k1) > num * tolerance);

    return `${h1}/${k1}`;
  }

  private formatDate(): string {
    const format = this.column.dateFormat || {};
    const date = new Date(this.value);
    
    if (isNaN(date.getTime())) return String(this.value);

    if (format.customFormat) {
      // Simple custom format implementation
      return format.customFormat
        .replace('YYYY', date.getFullYear().toString())
        .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', date.getDate().toString().padStart(2, '0'));
    }

    const options: Intl.DateTimeFormatOptions = {};
    switch (format.format) {
      case 'short':
        options.dateStyle = 'short';
        break;
      case 'medium':
        options.dateStyle = 'medium';
        break;
      case 'long':
        options.dateStyle = 'long';
        break;
      case 'full':
        options.dateStyle = 'full';
        break;
      default:
        options.dateStyle = 'short';
    }

    return new Intl.DateTimeFormat(format.locale || 'en-US', options).format(date);
  }

  private formatBoolean(): string {
    const format = this.column.booleanFormat || {};
    const bool = Boolean(this.value);

    if (format.useSymbols) {
      return bool 
        ? (format.trueSymbol || '✓') 
        : (format.falseSymbol || '✗');
    }

    return bool 
      ? (format.trueValue || 'true') 
      : (format.falseValue || 'false');
  }

  private formatRating(): string {
    const format = this.column.ratingFormat || {};
    const rating = Number(this.value);
    const max = format.max || 5;
    const symbol = format.symbol || '★';
    const emptySymbol = format.emptySymbol || '☆';

    if (isNaN(rating)) return String(this.value);

    let html = '';
    for (let i = 0; i < max; i++) {
      if (i < rating) {
        html += `<span style="color: ${format.color || '#ffc107'}">${symbol}</span>`;
      } else {
        html += `<span style="color: #ddd">${emptySymbol}</span>`;
      }
    }
    return html;
  }

  private formatProgress(): string {
    const format = this.column.progressFormat || {};
    const value = Number(this.value);
    const max = format.max || 100;
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    if (isNaN(value)) return String(this.value);

    const color = format.color || '#007bff';
    const bgColor = format.backgroundColor || '#e9ecef';
    const height = format.height || '1rem'; // Using rem for height

    let html = `
      <div style="
        width: 100%; 
        height: ${height}; 
        background-color: ${bgColor}; 
        border-radius: 0.25rem; 
        overflow: hidden;
        position: relative;
      ">
        <div style="
          width: ${percentage}%; 
          height: 100%; 
          background-color: ${color}; 
          transition: width 0.3s ease;
        "></div>
    `;

    if (format.showPercentage) {
      html += `
        <span style="
          position: absolute; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%);
          font-size: 0.75rem;
          font-weight: bold;
          color: ${percentage > 50 ? 'white' : 'black'};
        ">${Math.round(percentage)}%</span>
      `;
    }

    html += '</div>';
    return html;
  }

  private formatSparkline(): string {
    const format = this.column.sparklineFormat || {};
    const data = Array.isArray(this.value) ? this.value : [];
    
    if (data.length === 0) return '';

    const width = format.width || 60;
    const height = format.height || 20;
    const color = format.color || '#007bff';
    const type = format.type || 'line';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    if (type === 'line') {
      const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      }).join(' ');

      return `
        <svg width="${width}" height="${height}" style="display: block;">
          <polyline 
            points="${points}" 
            fill="none" 
            stroke="${color}" 
            stroke-width="2"
          />
        </svg>
      `;
    } else if (type === 'bar') {
      const barWidth = width / data.length;
      const bars = data.map((val, i) => {
        const barHeight = ((val - min) / range) * height;
        const x = i * barWidth;
        const y = height - barHeight;
        return `<rect x="${x}" y="${y}" width="${barWidth - 1}" height="${barHeight}" fill="${color}" />`;
      }).join('');

      return `
        <svg width="${width}" height="${height}" style="display: block;">
          ${bars}
        </svg>
      `;
    }

    return String(this.value);
  }

  private formatDuration(): string {
    const seconds = Number(this.value);
    if (isNaN(seconds)) return String(this.value);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  private formatFilesize(): string {
    const bytes = Number(this.value);
    if (isNaN(bytes)) return String(this.value);

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }
}