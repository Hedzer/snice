/**
 * Cell and row editing engine for snice-table.
 * Handles: inline editing, value pipeline, validation.
 */

export type EditorType = 'text' | 'number' | 'date' | 'boolean' | 'select';

export interface ValuePipeline {
  /** Derive/transform value (used for sort, filter, display) */
  valueGetter?: (value: any, row: any) => any;
  /** Format for display only (not used for sort/filter) */
  valueFormatter?: (value: any, row: any) => string;
  /** Parse edited input back to data type */
  valueParser?: (value: string, row: any) => any;
  /** Write value back to row object */
  valueSetter?: (value: any, row: any) => any;
}

export interface EditValidation {
  /** Sync or async validation. Return error message or null. */
  validate: (value: any, row: any) => string | null | Promise<string | null>;
}

export interface CellEditState {
  rowIndex: number;
  columnKey: string;
  originalValue: any;
  currentValue: any;
  editorType: EditorType;
  error: string | null;
  isEditing: boolean;
}

export interface RowEditState {
  rowIndex: number;
  originalRow: any;
  editedRow: any;
  errors: Map<string, string | null>;
  isEditing: boolean;
}

export type EditMode = 'cell' | 'row';

export class TableEditor {
  private cellState: CellEditState | null = null;
  private rowState: RowEditState | null = null;
  private pipelines: Map<string, ValuePipeline> = new Map();
  private validators: Map<string, EditValidation> = new Map();
  private editableColumns: Set<string> = new Set();
  private editabilityCheck: ((row: any, column: string) => boolean) | null = null;
  private tableElement: HTMLElement | null = null;
  private mode: EditMode = 'cell';

  attach(tableEl: HTMLElement) {
    this.tableElement = tableEl;
  }

  /** Register which columns are editable */
  setEditableColumns(columns: string[]) {
    this.editableColumns = new Set(columns);
  }

  /** Set conditional editability check */
  setEditabilityCheck(fn: (row: any, column: string) => boolean) {
    this.editabilityCheck = fn;
  }

  /** Set edit mode: cell or row */
  setEditMode(mode: EditMode) {
    this.mode = mode;
  }

  /** Register value pipeline for a column */
  setPipeline(columnKey: string, pipeline: ValuePipeline) {
    this.pipelines.set(columnKey, pipeline);
  }

  /** Register validation for a column */
  setValidation(columnKey: string, validation: EditValidation) {
    this.validators.set(columnKey, validation);
  }

  /** Check if a cell is editable */
  isCellEditable(row: any, columnKey: string): boolean {
    if (!this.editableColumns.has(columnKey)) return false;
    if (this.editabilityCheck) return this.editabilityCheck(row, columnKey);
    return true;
  }

  /** Get display value through pipeline */
  getDisplayValue(columnKey: string, value: any, row: any): string {
    const pipeline = this.pipelines.get(columnKey);
    let v = value;
    if (pipeline?.valueGetter) v = pipeline.valueGetter(v, row);
    if (pipeline?.valueFormatter) return pipeline.valueFormatter(v, row);
    return v == null ? '' : String(v);
  }

  /** Get sort/filter value through pipeline */
  getSortValue(columnKey: string, value: any, row: any): any {
    const pipeline = this.pipelines.get(columnKey);
    if (pipeline?.valueGetter) return pipeline.valueGetter(value, row);
    return value;
  }

  /** Determine editor type from column type */
  getEditorType(columnType: string): EditorType {
    switch (columnType) {
      case 'number':
      case 'currency':
      case 'rating':
      case 'progress':
        return 'number';
      case 'date':
        return 'date';
      case 'boolean':
        return 'boolean';
      default:
        return 'text';
    }
  }

  // ── Cell Editing ──

  /** Start editing a cell. Returns the edit state or null if not editable. */
  startCellEdit(rowIndex: number, columnKey: string, value: any, row: any): CellEditState | null {
    if (!this.isCellEditable(row, columnKey)) return null;

    // Cancel any existing edit
    if (this.cellState?.isEditing) this.cancelCellEdit();

    this.cellState = {
      rowIndex,
      columnKey,
      originalValue: value,
      currentValue: value,
      editorType: this.getEditorType(columnKey),
      error: null,
      isEditing: true,
    };

    return this.cellState;
  }

  /** Update the current cell value (while editing) */
  updateCellValue(value: any) {
    if (this.cellState) {
      this.cellState.currentValue = value;
      this.cellState.error = null;
    }
  }

  /** Validate and commit cell edit. Returns error message or null on success. */
  async commitCellEdit(): Promise<string | null> {
    if (!this.cellState?.isEditing) return null;

    const { columnKey, currentValue, rowIndex } = this.cellState;

    // Parse value through pipeline
    const pipeline = this.pipelines.get(columnKey);
    let parsedValue = currentValue;
    if (pipeline?.valueParser) {
      parsedValue = pipeline.valueParser(String(currentValue), {});
    }

    // Validate
    const validator = this.validators.get(columnKey);
    if (validator) {
      const error = await validator.validate(parsedValue, {});
      if (error) {
        this.cellState.error = error;
        return error;
      }
    }

    // Apply value through pipeline
    if (pipeline?.valueSetter) {
      parsedValue = pipeline.valueSetter(parsedValue, {});
    }

    // Dispatch commit event
    this.tableElement?.dispatchEvent(new CustomEvent('cell-edit-commit', {
      detail: {
        rowIndex,
        columnKey,
        oldValue: this.cellState.originalValue,
        newValue: parsedValue,
      },
      bubbles: true,
      composed: true,
    }));

    this.cellState.isEditing = false;
    this.cellState = null;
    return null;
  }

  /** Cancel cell edit */
  cancelCellEdit() {
    if (!this.cellState?.isEditing) return;

    this.tableElement?.dispatchEvent(new CustomEvent('cell-edit-cancel', {
      detail: {
        rowIndex: this.cellState.rowIndex,
        columnKey: this.cellState.columnKey,
      },
      bubbles: true,
      composed: true,
    }));

    this.cellState.isEditing = false;
    this.cellState = null;
  }

  getCellEditState(): CellEditState | null {
    return this.cellState;
  }

  // ── Row Editing ──

  /** Start editing an entire row */
  startRowEdit(rowIndex: number, row: any): RowEditState | null {
    if (this.rowState?.isEditing) this.cancelRowEdit();

    this.rowState = {
      rowIndex,
      originalRow: { ...row },
      editedRow: { ...row },
      errors: new Map(),
      isEditing: true,
    };

    return this.rowState;
  }

  /** Update a field in the current row edit */
  updateRowField(columnKey: string, value: any) {
    if (this.rowState) {
      this.rowState.editedRow[columnKey] = value;
      this.rowState.errors.delete(columnKey);
    }
  }

  /** Validate and commit row edit */
  async commitRowEdit(): Promise<Map<string, string> | null> {
    if (!this.rowState?.isEditing) return null;

    const errors = new Map<string, string>();

    // Validate each edited field
    for (const columnKey of this.editableColumns) {
      const validator = this.validators.get(columnKey);
      if (validator) {
        const value = this.rowState.editedRow[columnKey];
        const error = await validator.validate(value, this.rowState.editedRow);
        if (error) {
          errors.set(columnKey, error);
        }
      }
    }

    if (errors.size > 0) {
      this.rowState.errors = errors as any;
      return errors;
    }

    // Apply value pipelines
    const finalRow = { ...this.rowState.editedRow };
    for (const [key, pipeline] of this.pipelines) {
      if (pipeline.valueSetter && key in finalRow) {
        finalRow[key] = pipeline.valueSetter(finalRow[key], finalRow);
      }
    }

    this.tableElement?.dispatchEvent(new CustomEvent('row-edit-commit', {
      detail: {
        rowIndex: this.rowState.rowIndex,
        oldRow: this.rowState.originalRow,
        newRow: finalRow,
      },
      bubbles: true,
      composed: true,
    }));

    this.rowState.isEditing = false;
    this.rowState = null;
    return null;
  }

  /** Cancel row edit */
  cancelRowEdit() {
    if (!this.rowState?.isEditing) return;

    this.tableElement?.dispatchEvent(new CustomEvent('row-edit-cancel', {
      detail: { rowIndex: this.rowState.rowIndex },
      bubbles: true,
      composed: true,
    }));

    this.rowState.isEditing = false;
    this.rowState = null;
  }

  getRowEditState(): RowEditState | null {
    return this.rowState;
  }

  isEditing(): boolean {
    return (this.cellState?.isEditing || this.rowState?.isEditing) ?? false;
  }

  /** Create an editor element for a cell */
  createEditor(type: EditorType, value: any, options?: { selectOptions?: { value: string; label: string }[] }): HTMLElement {
    switch (type) {
      case 'number': {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = value == null ? '' : String(value);
        input.className = 'table-editor-input';
        return input;
      }
      case 'date': {
        const input = document.createElement('input');
        input.type = 'date';
        input.value = value || '';
        input.className = 'table-editor-input';
        return input;
      }
      case 'boolean': {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!value;
        input.className = 'table-editor-checkbox';
        return input;
      }
      case 'select': {
        const select = document.createElement('select');
        select.className = 'table-editor-select';
        (options?.selectOptions || []).forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          if (opt.value === String(value)) option.selected = true;
          select.appendChild(option);
        });
        return select;
      }
      default: {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value == null ? '' : String(value);
        input.className = 'table-editor-input';
        return input;
      }
    }
  }
}
