import { element, property, watch, ready, query, SimpleArray, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell.css?inline';
import type { SparklineFormat, SniceCellElement, ColumnType, ColumnAlign, ColumnDefinition } from './snice-table.types';

@element('snice-cell-sparkline')
export class SniceCellSparkline extends HTMLElement implements SniceCellElement {
  @property({  })
  align: ColumnAlign = 'left';

  @property({  })
  type: ColumnType = 'sparkline';

  @property({  })
  value: any = '';

  @property({ type: Object })
  column: ColumnDefinition = {
    key: '',
    label: '',
    type: 'sparkline',
    align: 'left'
  };

  @property({ type: Object })
  rowData: any = null;

  @query('.cell-content')
  contentElement?: HTMLElement;
  
  @property({  attribute: 'chart-type' })
  chartType: 'line' | 'bar' | 'area' = 'line';

  @property({  })
  color: string = 'var(--snice-color-primary)';

  @property({ type: Number,  })
  width: number = 80;

  @property({ type: Number,  })
  height: number = 24;

  @property({ type: Boolean,  attribute: 'show-dots' })
  showDots: boolean = false;

  @property({ type: Boolean,  attribute: 'show-baseline' })
  showBaseline: boolean = false;

  @property({ type: Number,  attribute: 'stroke-width' })
  strokeWidth: number = 1.5;

  @property({ type: Number,  attribute: 'min-value' })
  minValue?: number;

  @property({ type: Number,  attribute: 'max-value' })
  maxValue?: number;

  @property({ type: SimpleArray,  })
  data: number[] = [];

  @render()
  renderContent() {
    return html/*html*/`
      <div class="cell-content cell-content--sparkline" part="content">
        ${unsafeHTML(this.renderSparkline())}
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
    this.updateSparkline();
  }

  private applyAlignment() {
    this.style.textAlign = this.align;
  }

  @watch('align')
  updateAlignment() {
    this.applyAlignment();
  }

  @watch('value', 'data', 'column')
  updateContent() {
    if (this.contentElement) {
      this.contentElement.innerHTML = this.renderSparkline();
    }
  }

  @watch('value', 'data', 'chartType', 'color', 'width', 'height', 'showDots', 'showBaseline', 'strokeWidth', 'minValue', 'maxValue')
  updateSparkline() {
    if (this.contentElement) {
      this.contentElement.innerHTML = this.renderSparkline();
    }
  }

  private renderSparkline(): string {
    if ((this.value === null || this.value === undefined) && (!this.data || this.data.length === 0)) {
      return '';
    }

    // Use custom formatter if provided
    if (this.column.formatter) {
      return this.column.formatter(this.value, this.rowData);
    }

    const data = this.parseData();
    if (data.length === 0) {
      return '<span style="color: #6c757d; font-style: italic;">No data</span>';
    }

    // Use column sparkline format or component properties
    const format: SparklineFormat = this.column.sparklineFormat || {
      type: this.chartType,
      color: this.color,
      width: this.width,
      height: this.height
    };

    const width = format.width ?? this.width;
    const height = format.height ?? this.height;
    const color = format.color ?? this.color;
    const type = format.type ?? this.chartType;

    return this.createCanvas(data, width, height, color, type);
  }

  private parseData(): number[] {
    // First, try the dedicated data property (using SimpleArray)
    if (this.data && Array.isArray(this.data) && this.data.length > 0) {
      return this.data.map(v => Number(v)).filter(n => !isNaN(n));
    }

    // Fallback to value property for backwards compatibility
    if (Array.isArray(this.value)) {
      return this.value.map(v => Number(v)).filter(n => !isNaN(n));
    }
    
    if (typeof this.value === 'string') {
      // Try to parse as JSON array first (e.g., "[1,2,3]")
      if (this.value.startsWith('[') && this.value.endsWith(']')) {
        try {
          const parsed = JSON.parse(this.value);
          if (Array.isArray(parsed)) {
            return parsed.map(v => Number(v)).filter(n => !isNaN(n));
          }
        } catch {
          // Fall through to comma-separated parsing
        }
      }
      
      // Try to parse comma-separated values
      try {
        return this.value.split(',').map(v => Number(v.trim())).filter(n => !isNaN(n));
      } catch {
        return [];
      }
    }

    return [];
  }

  private createCanvas(data: number[], width: number, height: number, color: string, type: string): string {
    if (data.length === 0) return '';

    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '<div style="color: red;">Canvas not supported</div>';

    const padding = 2;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const min = this.minValue ?? Math.min(...data);
    const max = this.maxValue ?? Math.max(...data);
    const range = max - min || 1;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set color and line properties
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'line' || type === 'area') {
      const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((val - min) / range) * chartHeight;
        return [x, y];
      });

      // Draw area fill if needed
      if (type === 'area') {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        points.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(points[points.length - 1][0], height - padding);
        ctx.lineTo(points[0][0], height - padding);
        ctx.closePath();
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw line
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      points.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.stroke();

      // Draw dots if enabled
      if (this.showDots) {
        points.forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

    } else if (type === 'bar') {
      const barWidth = (chartWidth / data.length) * 0.8;
      const barSpacing = (chartWidth / data.length) * 0.2;

      data.forEach((val, i) => {
        const barHeight = ((val - min) / range) * chartHeight;
        const x = padding + i * (barWidth + barSpacing);
        const y = padding + chartHeight - barHeight;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // Convert canvas to data URL
    try {
      const dataUrl = canvas.toDataURL('image/png');
      return `<img src="${dataUrl}" width="${width}" height="${height}" alt="Sparkline chart" style="display: block; vertical-align: middle;">`;
    } catch (error) {
      console.error('Error creating canvas image:', error);
      return `<div style="color: red;">Canvas error</div>`;
    }
  }
}