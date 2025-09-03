import { element, property, watch } from '../../src/index';
import type { 
  SniceColumnElement, 
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

@element('snice-column')
export class SniceColumn extends HTMLElement implements SniceColumnElement {
  @property({ reflect: true })
  key: string = '';

  @property({ reflect: true })
  label: string = '';

  @property({ reflect: true })
  type: ColumnType = 'text';

  @property({ reflect: true })
  align: ColumnAlign = 'left';

  @property({ reflect: true })
  width: string = '';

  @property({ type: Boolean, reflect: true })
  sortable: boolean = true;

  @property({ type: Boolean, reflect: true })
  filterable: boolean = true;

  @property({ type: Boolean, reflect: true })
  wrap: boolean = false;

  @property({ type: Boolean, reflect: true })
  ellipsis: boolean = true;

  @property({ type: Boolean, reflect: true })
  tooltip: boolean = false;

  // Number formatting properties
  @property({ type: Number, attribute: 'decimals' })
  decimals?: number;

  @property({ type: Boolean, attribute: 'thousands-separator' })
  thousandsSeparator?: boolean;

  @property({ attribute: 'number-prefix' })
  numberPrefix?: string;

  @property({ attribute: 'number-suffix' })
  numberSuffix?: string;

  @property({ attribute: 'negative-style' })
  negativeStyle?: 'parentheses' | 'red' | 'minus';

  // Date formatting properties
  @property({ attribute: 'date-format' })
  dateFormat?: 'short' | 'medium' | 'long' | 'full' | 'custom';

  @property({ attribute: 'custom-date-format' })
  customDateFormat?: string;

  @property({ attribute: 'date-locale' })
  dateLocale?: string;

  // Boolean formatting properties
  @property({ attribute: 'true-value' })
  trueValue?: string;

  @property({ attribute: 'false-value' })
  falseValue?: string;

  @property({ type: Boolean, attribute: 'use-symbols' })
  useSymbols?: boolean;

  @property({ attribute: 'true-symbol' })
  trueSymbol?: string;

  @property({ attribute: 'false-symbol' })
  falseSymbol?: string;

  // Rating formatting properties
  @property({ type: Number, attribute: 'rating-max' })
  ratingMax?: number;

  @property({ attribute: 'rating-symbol' })
  ratingSymbol?: string;

  @property({ attribute: 'rating-empty-symbol' })
  ratingEmptySymbol?: string;

  @property({ attribute: 'rating-color' })
  ratingColor?: string;

  // Progress formatting properties
  @property({ type: Number, attribute: 'progress-max' })
  progressMax?: number;

  @property({ type: Boolean, attribute: 'show-percentage' })
  showPercentage?: boolean;

  @property({ attribute: 'progress-color' })
  progressColor?: string;

  @property({ attribute: 'progress-bg-color' })
  progressBgColor?: string;

  @property({ attribute: 'progress-height' })
  progressHeight?: string;

  // Sparkline formatting properties
  @property({ attribute: 'sparkline-type' })
  sparklineType?: 'line' | 'bar' | 'area';

  @property({ attribute: 'sparkline-color' })
  sparklineColor?: string;

  @property({ type: Number, attribute: 'sparkline-width' })
  sparklineWidth?: number;

  @property({ type: Number, attribute: 'sparkline-height' })
  sparklineHeight?: number;

  // Style properties
  @property({ attribute: 'cell-bg-color' })
  cellBgColor?: string;

  @property({ attribute: 'cell-color' })
  cellColor?: string;

  @property({ attribute: 'cell-font-weight' })
  cellFontWeight?: 'normal' | 'bold' | 'lighter';

  @property({ attribute: 'cell-font-style' })
  cellFontStyle?: 'normal' | 'italic';

  @property({ attribute: 'cell-font-size' })
  cellFontSize?: string;

  @property({ attribute: 'cell-text-decoration' })
  cellTextDecoration?: 'none' | 'underline' | 'line-through';

  private formatter?: (value: any, row?: any) => string;
  private conditionalFormats: ConditionalFormat[] = [];

  html() {
    return `<slot></slot>`;
  }

  // Set custom formatter function
  setFormatter(formatter: (value: any, row?: any) => string) {
    this.formatter = formatter;
    this.notifyTableOfChange();
  }

  // Add conditional formatting rule
  addConditionalFormat(format: ConditionalFormat) {
    this.conditionalFormats.push(format);
    this.notifyTableOfChange();
  }

  // Remove conditional formatting rule
  removeConditionalFormat(index: number) {
    this.conditionalFormats.splice(index, 1);
    this.notifyTableOfChange();
  }

  // Clear all conditional formatting
  clearConditionalFormats() {
    this.conditionalFormats = [];
    this.notifyTableOfChange();
  }

  // Get the complete column definition for the table
  getColumnDefinition(): ColumnDefinition {
    const definition: ColumnDefinition = {
      key: this.key,
      label: this.label,
      type: this.type,
      align: this.align,
      width: this.width,
      sortable: this.sortable,
      filterable: this.filterable,
      wrap: this.wrap,
      ellipsis: this.ellipsis,
      tooltip: this.tooltip,
      formatter: this.formatter,
      conditionalFormats: this.conditionalFormats
    };

    // Add type-specific formatting
    if (this.type === 'number' || this.type === 'currency' || this.type === 'percent' || 
        this.type === 'accounting' || this.type === 'scientific' || this.type === 'fraction') {
      const numberFormat: NumberFormat = {};
      if (this.decimals !== undefined) numberFormat.decimals = this.decimals;
      if (this.thousandsSeparator !== undefined) numberFormat.thousandsSeparator = this.thousandsSeparator;
      if (this.numberPrefix) numberFormat.prefix = this.numberPrefix;
      if (this.numberSuffix) numberFormat.suffix = this.numberSuffix;
      if (this.negativeStyle) numberFormat.negativeStyle = this.negativeStyle;
      
      if (Object.keys(numberFormat).length > 0) {
        definition.numberFormat = numberFormat;
      }
    }

    if (this.type === 'date') {
      const dateFormat: DateFormat = {};
      if (this.dateFormat) dateFormat.format = this.dateFormat;
      if (this.customDateFormat) dateFormat.customFormat = this.customDateFormat;
      if (this.dateLocale) dateFormat.locale = this.dateLocale;
      
      if (Object.keys(dateFormat).length > 0) {
        definition.dateFormat = dateFormat;
      }
    }

    if (this.type === 'boolean') {
      const booleanFormat: BooleanFormat = {};
      if (this.trueValue) booleanFormat.trueValue = this.trueValue;
      if (this.falseValue) booleanFormat.falseValue = this.falseValue;
      if (this.useSymbols !== undefined) booleanFormat.useSymbols = this.useSymbols;
      if (this.trueSymbol) booleanFormat.trueSymbol = this.trueSymbol;
      if (this.falseSymbol) booleanFormat.falseSymbol = this.falseSymbol;
      
      if (Object.keys(booleanFormat).length > 0) {
        definition.booleanFormat = booleanFormat;
      }
    }

    if (this.type === 'rating') {
      const ratingFormat: RatingFormat = {};
      if (this.ratingMax !== undefined) ratingFormat.max = this.ratingMax;
      if (this.ratingSymbol) ratingFormat.symbol = this.ratingSymbol;
      if (this.ratingEmptySymbol) ratingFormat.emptySymbol = this.ratingEmptySymbol;
      if (this.ratingColor) ratingFormat.color = this.ratingColor;
      
      if (Object.keys(ratingFormat).length > 0) {
        definition.ratingFormat = ratingFormat;
      }
    }

    if (this.type === 'progress') {
      const progressFormat: ProgressFormat = {};
      if (this.progressMax !== undefined) progressFormat.max = this.progressMax;
      if (this.showPercentage !== undefined) progressFormat.showPercentage = this.showPercentage;
      if (this.progressColor) progressFormat.color = this.progressColor;
      if (this.progressBgColor) progressFormat.backgroundColor = this.progressBgColor;
      if (this.progressHeight) progressFormat.height = this.progressHeight;
      
      if (Object.keys(progressFormat).length > 0) {
        definition.progressFormat = progressFormat;
      }
    }

    if (this.type === 'sparkline') {
      const sparklineFormat: SparklineFormat = {};
      if (this.sparklineType) sparklineFormat.type = this.sparklineType;
      if (this.sparklineColor) sparklineFormat.color = this.sparklineColor;
      if (this.sparklineWidth !== undefined) sparklineFormat.width = this.sparklineWidth;
      if (this.sparklineHeight !== undefined) sparklineFormat.height = this.sparklineHeight;
      
      if (Object.keys(sparklineFormat).length > 0) {
        definition.sparklineFormat = sparklineFormat;
      }
    }

    // Add cell style if any style properties are set
    const cellStyle: CellStyle = {};
    if (this.cellBgColor) cellStyle.backgroundColor = this.cellBgColor;
    if (this.cellColor) cellStyle.color = this.cellColor;
    if (this.cellFontWeight) cellStyle.fontWeight = this.cellFontWeight;
    if (this.cellFontStyle) cellStyle.fontStyle = this.cellFontStyle;
    if (this.cellFontSize) cellStyle.fontSize = this.cellFontSize;
    if (this.cellTextDecoration) cellStyle.textDecoration = this.cellTextDecoration;
    
    if (Object.keys(cellStyle).length > 0) {
      definition.style = cellStyle;
    }

    return definition;
  }

  @watch('key', 'label', 'type', 'align', 'width', 'sortable', 'filterable', 'wrap', 'ellipsis', 'tooltip')
  private handleBasicPropsChange() {
    this.notifyTableOfChange();
  }

  @watch('decimals', 'thousandsSeparator', 'numberPrefix', 'numberSuffix', 'negativeStyle')
  private handleNumberFormatChange() {
    if (this.type === 'number' || this.type === 'currency' || this.type === 'percent' || 
        this.type === 'accounting' || this.type === 'scientific' || this.type === 'fraction') {
      this.notifyTableOfChange();
    }
  }

  @watch('dateFormat', 'customDateFormat', 'dateLocale')
  private handleDateFormatChange() {
    if (this.type === 'date') {
      this.notifyTableOfChange();
    }
  }

  @watch('trueValue', 'falseValue', 'useSymbols', 'trueSymbol', 'falseSymbol')
  private handleBooleanFormatChange() {
    if (this.type === 'boolean') {
      this.notifyTableOfChange();
    }
  }

  @watch('ratingMax', 'ratingSymbol', 'ratingEmptySymbol', 'ratingColor')
  private handleRatingFormatChange() {
    if (this.type === 'rating') {
      this.notifyTableOfChange();
    }
  }

  @watch('progressMax', 'showPercentage', 'progressColor', 'progressBgColor', 'progressHeight')
  private handleProgressFormatChange() {
    if (this.type === 'progress') {
      this.notifyTableOfChange();
    }
  }

  @watch('sparklineType', 'sparklineColor', 'sparklineWidth', 'sparklineHeight')
  private handleSparklineFormatChange() {
    if (this.type === 'sparkline') {
      this.notifyTableOfChange();
    }
  }

  @watch('cellBgColor', 'cellColor', 'cellFontWeight', 'cellFontStyle', 'cellFontSize', 'cellTextDecoration')
  private handleStyleChange() {
    this.notifyTableOfChange();
  }

  private notifyTableOfChange() {
    // Dispatch event to parent table to notify of column definition change
    this.dispatchEvent(new CustomEvent('@snice/column-changed', {
      detail: { column: this.getColumnDefinition() },
      bubbles: true,
      composed: true
    }));
  }
}