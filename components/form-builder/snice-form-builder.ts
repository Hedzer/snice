import { element, property, render, styles, dispatch, ready, watch, html, css } from 'snice';
import type { SniceFormBuilderElement, FormSchema, FormField, FormFieldType, FormFieldOption, FormBuilderMode } from './snice-form-builder.types';
import cssContent from './snice-form-builder.css?inline';

const FIELD_TYPE_META: Record<FormFieldType, { icon: string; label: string }> = {
  text:      { icon: 'Aa', label: 'Text' },
  number:    { icon: '#',  label: 'Number' },
  email:     { icon: '@',  label: 'Email' },
  phone:     { icon: '\u260E',  label: 'Phone' },
  select:    { icon: '\u25BE',  label: 'Select' },
  date:      { icon: '\uD83D\uDCC5', label: 'Date' },
  checkbox:  { icon: '\u2611',  label: 'Checkbox' },
  radio:     { icon: '\u25C9',  label: 'Radio' },
  file:      { icon: '\uD83D\uDCCE', label: 'File' },
  signature: { icon: '\u270D',  label: 'Signature' },
  section:   { icon: '\u2500',  label: 'Section' },
  paragraph: { icon: '\u00B6',  label: 'Paragraph' },
};

const DEFAULT_FIELD_TYPES: FormFieldType[] = [
  'text', 'number', 'email', 'phone', 'select', 'date',
  'checkbox', 'radio', 'file', 'signature', 'section', 'paragraph',
];

@element('snice-form-builder')
export class SniceFormBuilder extends HTMLElement implements SniceFormBuilderElement {
  @property({ type: Object, attribute: false })
  schema: FormSchema = { fields: [] };

  @property()
  mode: FormBuilderMode = 'edit';

  @property({ type: Array, attribute: false })
  fieldTypes: FormFieldType[] = DEFAULT_FIELD_TYPES;

  private selectedFieldId: string | null = null;
  private dragFieldIndex: number = -1;
  private dragOverIndex: number = -1;
  private idCounter: number = 0;

  // ── Events ──

  @dispatch('schema-change', { bubbles: true, composed: true })
  private emitSchemaChange() {
    return { schema: this.schema };
  }

  @dispatch('field-add', { bubbles: true, composed: true })
  private emitFieldAdd(field: FormField) {
    return { field };
  }

  @dispatch('field-remove', { bubbles: true, composed: true })
  private emitFieldRemove(field: FormField) {
    return { field };
  }

  @dispatch('field-reorder', { bubbles: true, composed: true })
  private emitFieldReorder(oldIndex: number, newIndex: number, field: FormField) {
    return { oldIndex, newIndex, field };
  }

  // ── Public API ──

  getSchema(): FormSchema {
    return JSON.parse(JSON.stringify(this.schema));
  }

  setSchema(schema: FormSchema): void {
    this.schema = JSON.parse(JSON.stringify(schema));
    this.selectedFieldId = null;
    this.emitSchemaChange();
  }

  addField(type: FormFieldType): void {
    const field = this.createField(type);
    this.schema = {
      ...this.schema,
      fields: [...this.schema.fields, field],
    };
    this.selectedFieldId = field.id;
    this.emitFieldAdd(field);
    this.emitSchemaChange();
  }

  removeField(id: string): void {
    const field = this.schema.fields.find(f => f.id === id);
    if (!field) return;
    this.schema = {
      ...this.schema,
      fields: this.schema.fields.filter(f => f.id !== id),
    };
    if (this.selectedFieldId === id) {
      this.selectedFieldId = null;
    }
    this.emitFieldRemove(field);
    this.emitSchemaChange();
  }

  preview(): void {
    this.mode = 'preview';
  }

  // ── Field creation ──

  private generateId(): string {
    this.idCounter++;
    return `field_${Date.now()}_${this.idCounter}`;
  }

  private createField(type: FormFieldType): FormField {
    const meta = FIELD_TYPE_META[type];
    const field: FormField = {
      id: this.generateId(),
      type,
      label: meta.label,
    };

    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      field.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
    }

    if (type === 'section') {
      field.label = 'Section Title';
    }

    if (type === 'paragraph') {
      field.content = 'Enter descriptive text here.';
    }

    return field;
  }

  // ── Field updates ──

  private updateField(id: string, updates: Partial<FormField>): void {
    this.schema = {
      ...this.schema,
      fields: this.schema.fields.map(f =>
        f.id === id ? { ...f, ...updates } : f
      ),
    };
    this.emitSchemaChange();
  }

  private duplicateField(id: string): void {
    const field = this.schema.fields.find(f => f.id === id);
    if (!field) return;
    const index = this.schema.fields.indexOf(field);
    const copy: FormField = {
      ...JSON.parse(JSON.stringify(field)),
      id: this.generateId(),
      label: `${field.label} (copy)`,
    };
    const fields = [...this.schema.fields];
    fields.splice(index + 1, 0, copy);
    this.schema = { ...this.schema, fields };
    this.selectedFieldId = copy.id;
    this.emitFieldAdd(copy);
    this.emitSchemaChange();
  }

  // ── Drag/drop (reorder) ──

  private handleFieldDragStart(index: number, e: DragEvent): void {
    this.dragFieldIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
    (e.currentTarget as HTMLElement).classList.add('field--dragging');
  }

  private handleFieldDragOver(index: number, e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (this.dragOverIndex !== index) {
      this.dragOverIndex = index;
      // Visual feedback via class
      this.updateDragOverVisual(index);
    }
  }

  private updateDragOverVisual(overIndex: number): void {
    const fieldEls = this.shadowRoot?.querySelectorAll('.field');
    fieldEls?.forEach((el, i) => {
      el.classList.toggle('field--drag-over', i === overIndex && i !== this.dragFieldIndex);
    });
  }

  private handleFieldDragEnd(e: DragEvent): void {
    (e.currentTarget as HTMLElement).classList.remove('field--dragging');
    this.shadowRoot?.querySelectorAll('.field--drag-over').forEach(el =>
      el.classList.remove('field--drag-over')
    );
    this.dragOverIndex = -1;
  }

  private handleFieldDrop(dropIndex: number, e: DragEvent): void {
    e.preventDefault();
    const fromIndex = this.dragFieldIndex;
    if (fromIndex < 0 || fromIndex === dropIndex) {
      this.dragFieldIndex = -1;
      return;
    }

    const fields = [...this.schema.fields];
    const [moved] = fields.splice(fromIndex, 1);
    const adjustedIndex = dropIndex > fromIndex ? dropIndex - 1 : dropIndex;
    fields.splice(adjustedIndex, 0, moved);
    this.schema = { ...this.schema, fields };

    this.emitFieldReorder(fromIndex, adjustedIndex, moved);
    this.emitSchemaChange();
    this.dragFieldIndex = -1;
  }

  // ── Toolbar drag into canvas ──

  private handleToolbarDragStart(type: FormFieldType, e: DragEvent): void {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/form-field-type', type);
    }
  }

  private handleCanvasDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }

  private handleCanvasDrop(e: DragEvent): void {
    e.preventDefault();
    const type = e.dataTransfer?.getData('application/form-field-type') as FormFieldType;
    if (type && FIELD_TYPE_META[type]) {
      this.addField(type);
    }
    this.shadowRoot?.querySelector('.canvas__fields--drag-over')?.classList.remove('canvas__fields--drag-over');
  }

  private handleCanvasDragEnter(e: DragEvent): void {
    const hasType = e.dataTransfer?.types.includes('application/form-field-type');
    if (hasType) {
      (e.currentTarget as HTMLElement).classList.add('canvas__fields--drag-over');
    }
  }

  private handleCanvasDragLeave(e: DragEvent): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const isOutside = x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
    if (isOutside) {
      (e.currentTarget as HTMLElement).classList.remove('canvas__fields--drag-over');
    }
  }

  // ── Options management ──

  private addOption(fieldId: string): void {
    const field = this.schema.fields.find(f => f.id === fieldId);
    if (!field) return;
    const num = (field.options?.length || 0) + 1;
    const newOption: FormFieldOption = { label: `Option ${num}`, value: `option${num}` };
    this.updateField(fieldId, {
      options: [...(field.options || []), newOption],
    });
  }

  private removeOption(fieldId: string, optIndex: number): void {
    const field = this.schema.fields.find(f => f.id === fieldId);
    if (!field?.options) return;
    const options = field.options.filter((_, i) => i !== optIndex);
    this.updateField(fieldId, { options });
  }

  private updateOption(fieldId: string, optIndex: number, label: string): void {
    const field = this.schema.fields.find(f => f.id === fieldId);
    if (!field?.options) return;
    const options = field.options.map((opt, i) =>
      i === optIndex ? { ...opt, label, value: label.toLowerCase().replace(/\s+/g, '_') } : opt
    );
    this.updateField(fieldId, { options });
  }

  // ── Form header ──

  private handleTitleChange(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.schema = { ...this.schema, title: value };
    this.emitSchemaChange();
  }

  private handleDescriptionChange(e: Event): void {
    const value = (e.target as HTMLTextAreaElement).value;
    this.schema = { ...this.schema, description: value };
    this.emitSchemaChange();
  }

  // ── Rendering ──

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  @render()
  template() {
    return html`
      <div class="mode-toggle" part="mode-toggle">
        <button
          class="mode-toggle__btn ${this.mode === 'edit' ? 'mode-toggle__btn--active' : ''}"
          @click=${() => { this.mode = 'edit'; }}>
          Edit
        </button>
        <button
          class="mode-toggle__btn ${this.mode === 'preview' ? 'mode-toggle__btn--active' : ''}"
          @click=${() => { this.mode = 'preview'; }}>
          Preview
        </button>
      </div>

      <if ${this.mode === 'edit'}>
        ${this.renderEditMode()}
      </if>
      <if ${this.mode === 'preview'}>
        ${this.renderPreviewMode()}
      </if>
    `;
  }

  private renderEditMode() {
    const selectedField = this.schema.fields.find(f => f.id === this.selectedFieldId) || null;

    return html`
      <div class="form-builder" part="base">
        ${this.renderToolbar()}
        ${this.renderCanvas()}
        ${this.renderProperties(selectedField)}
      </div>
    `;
  }

  private renderToolbar() {
    return html`
      <div class="toolbar" part="toolbar">
        <div class="toolbar__title">Fields</div>
        ${this.fieldTypes.map(type => {
          const meta = FIELD_TYPE_META[type];
          return html`
            <div
              class="toolbar__item"
              draggable="true"
              @dragstart=${(e: DragEvent) => this.handleToolbarDragStart(type, e)}
              @click=${() => this.addField(type)}>
              <span class="toolbar__icon">${meta.icon}</span>
              <span>${meta.label}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderCanvas() {
    const fields = this.schema.fields;
    const hasFields = fields.length > 0;

    return html`
      <div class="canvas" part="canvas">
        <div class="canvas__header">
          <input
            class="canvas__title"
            type="text"
            placeholder="Form Title"
            .value=${this.schema.title || ''}
            @input=${this.handleTitleChange}
          />
          <textarea
            class="canvas__description"
            placeholder="Form description (optional)"
            rows="1"
            .value=${this.schema.description || ''}
            @input=${this.handleDescriptionChange}
          ></textarea>
        </div>

        <div
          class="canvas__fields"
          @dragover=${(e: DragEvent) => this.handleCanvasDragOver(e)}
          @drop=${(e: DragEvent) => this.handleCanvasDrop(e)}
          @dragenter=${(e: DragEvent) => this.handleCanvasDragEnter(e)}
          @dragleave=${(e: DragEvent) => this.handleCanvasDragLeave(e)}>

          <if ${!hasFields}>
            <div class="canvas__empty">
              <span class="canvas__empty-icon">+</span>
              <span>Drag fields here or click from the palette</span>
            </div>
          </if>

          ${fields.map((field, index) => html`
            <div
              class="field ${this.selectedFieldId === field.id ? 'field--selected' : ''}"
              draggable="true"
              @click=${() => { this.selectedFieldId = field.id; }}
              @dragstart=${(e: DragEvent) => this.handleFieldDragStart(index, e)}
              @dragover=${(e: DragEvent) => this.handleFieldDragOver(index, e)}
              @dragend=${(e: DragEvent) => this.handleFieldDragEnd(e)}
              @drop=${(e: DragEvent) => this.handleFieldDrop(index, e)}>
              <span class="field__drag-handle">\u2630</span>
              <div class="field__content">
                <div class="field__label">
                  ${field.label}
                  <if ${field.required}>
                    <span class="field__required">*</span>
                  </if>
                </div>
                <div class="field__type">${FIELD_TYPE_META[field.type]?.label || field.type}</div>
              </div>
              <div class="field__actions">
                <button class="field__action" title="Duplicate" @click=${(e: Event) => { e.stopPropagation(); this.duplicateField(field.id); }}>\u2398</button>
                <button class="field__action field__action--delete" title="Delete" @click=${(e: Event) => { e.stopPropagation(); this.removeField(field.id); }}>\u2715</button>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderProperties(field: FormField | null) {
    if (!field) {
      return html`
        <div class="properties" part="properties">
          <div class="properties__title">Properties</div>
          <div class="properties__empty">Select a field to edit its properties</div>
        </div>
      `;
    }

    const isLayout = field.type === 'section' || field.type === 'paragraph';
    const hasOptions = field.type === 'select' || field.type === 'radio' || field.type === 'checkbox';

    return html`
      <div class="properties" part="properties">
        <div class="properties__title">Properties</div>

        <div class="properties__group">
          <label class="properties__label">Label</label>
          <input
            class="properties__input"
            type="text"
            .value=${field.label}
            @input=${(e: Event) => this.updateField(field.id, { label: (e.target as HTMLInputElement).value })}
          />
        </div>

        <if ${!isLayout}>
          <div class="properties__group">
            <label class="properties__label">Placeholder</label>
            <input
              class="properties__input"
              type="text"
              .value=${field.placeholder || ''}
              @input=${(e: Event) => this.updateField(field.id, { placeholder: (e.target as HTMLInputElement).value })}
            />
          </div>

          <div class="properties__group">
            <label class="properties__label">Help Text</label>
            <input
              class="properties__input"
              type="text"
              .value=${field.helpText || ''}
              @input=${(e: Event) => this.updateField(field.id, { helpText: (e.target as HTMLInputElement).value })}
            />
          </div>

          <div class="properties__checkbox-row">
            <input
              type="checkbox"
              id="prop-required"
              ?checked=${field.required || false}
              @change=${(e: Event) => this.updateField(field.id, { required: (e.target as HTMLInputElement).checked })}
            />
            <label class="properties__checkbox-label" for="prop-required">Required</label>
          </div>

          <div class="properties__group">
            <label class="properties__label">Width</label>
            <select
              class="properties__select"
              .value=${field.width || 'full'}
              @change=${(e: Event) => this.updateField(field.id, { width: (e.target as HTMLSelectElement).value as 'full' | 'half' })}>
              <option value="full">Full width</option>
              <option value="half">Half width</option>
            </select>
          </div>
        </if>

        <if ${field.type === 'paragraph'}>
          <div class="properties__group">
            <label class="properties__label">Content</label>
            <textarea
              class="properties__textarea"
              rows="3"
              .value=${field.content || ''}
              @input=${(e: Event) => this.updateField(field.id, { content: (e.target as HTMLTextAreaElement).value })}
            ></textarea>
          </div>
        </if>

        <if ${field.type === 'number'}>
          <div class="properties__group">
            <label class="properties__label">Min</label>
            <input
              class="properties__input"
              type="number"
              .value=${field.min != null ? String(field.min) : ''}
              @input=${(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                this.updateField(field.id, { min: val ? Number(val) : undefined });
              }}
            />
          </div>
          <div class="properties__group">
            <label class="properties__label">Max</label>
            <input
              class="properties__input"
              type="number"
              .value=${field.max != null ? String(field.max) : ''}
              @input=${(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                this.updateField(field.id, { max: val ? Number(val) : undefined });
              }}
            />
          </div>
        </if>

        <if ${field.type === 'file'}>
          <div class="properties__group">
            <label class="properties__label">Accept (file types)</label>
            <input
              class="properties__input"
              type="text"
              placeholder=".pdf,.jpg,.png"
              .value=${field.accept || ''}
              @input=${(e: Event) => this.updateField(field.id, { accept: (e.target as HTMLInputElement).value })}
            />
          </div>
        </if>

        <if ${hasOptions}>
          <div class="properties__group">
            <label class="properties__label">Options</label>
            <div class="options-editor">
              ${(field.options || []).map((opt, i) => html`
                <div class="options-editor__row">
                  <input
                    class="options-editor__input"
                    type="text"
                    .value=${opt.label}
                    @input=${(e: Event) => this.updateOption(field.id, i, (e.target as HTMLInputElement).value)}
                  />
                  <button
                    class="options-editor__remove"
                    @click=${() => this.removeOption(field.id, i)}
                    title="Remove option">\u2715</button>
                </div>
              `)}
              <button class="options-editor__add" @click=${() => this.addOption(field.id)}>+ Add option</button>
            </div>
          </div>
        </if>
      </div>
    `;
  }

  // ── Preview ──

  private renderPreviewMode() {
    return html`
      <div class="preview" part="preview">
        <if ${this.schema.title}>
          <div class="preview__title">${this.schema.title}</div>
        </if>
        <if ${this.schema.description}>
          <div class="preview__description">${this.schema.description}</div>
        </if>
        ${this.schema.fields.map(field => this.renderPreviewField(field))}
      </div>
    `;
  }

  private renderPreviewField(field: FormField) {
    switch (field.type) {
      case 'section':
        return html`<div class="preview__section">${field.label}</div>`;

      case 'paragraph':
        return html`<div class="preview__paragraph">${field.content || ''}</div>`;

      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'date':
        return html`
          <div class="preview__field">
            <label class="preview__label">
              ${field.label}
              <if ${field.required}><span class="preview__required">*</span></if>
            </label>
            <input
              class="preview__input"
              type="${field.type === 'phone' ? 'tel' : field.type}"
              placeholder="${field.placeholder || ''}"
              ?required=${field.required}
              min="${field.min != null ? String(field.min) : ''}"
              max="${field.max != null ? String(field.max) : ''}"
            />
            <if ${field.helpText}>
              <div class="preview__help">${field.helpText}</div>
            </if>
          </div>
        `;

      case 'select':
        return html`
          <div class="preview__field">
            <label class="preview__label">
              ${field.label}
              <if ${field.required}><span class="preview__required">*</span></if>
            </label>
            <select class="preview__select" ?required=${field.required}>
              <option value="">${field.placeholder || 'Select...'}</option>
              ${(field.options || []).map(opt => html`
                <option value="${opt.value}">${opt.label}</option>
              `)}
            </select>
            <if ${field.helpText}>
              <div class="preview__help">${field.helpText}</div>
            </if>
          </div>
        `;

      case 'checkbox':
        return html`
          <div class="preview__field">
            <label class="preview__label">
              ${field.label}
              <if ${field.required}><span class="preview__required">*</span></if>
            </label>
            <div class="preview__checkbox-group">
              ${(field.options || []).map(opt => html`
                <label class="preview__checkbox-row">
                  <input type="checkbox" value="${opt.value}" />
                  ${opt.label}
                </label>
              `)}
            </div>
            <if ${field.helpText}>
              <div class="preview__help">${field.helpText}</div>
            </if>
          </div>
        `;

      case 'radio':
        return html`
          <div class="preview__field">
            <label class="preview__label">
              ${field.label}
              <if ${field.required}><span class="preview__required">*</span></if>
            </label>
            <div class="preview__radio-group">
              ${(field.options || []).map(opt => html`
                <label class="preview__radio-row">
                  <input type="radio" name="${field.id}" value="${opt.value}" />
                  ${opt.label}
                </label>
              `)}
            </div>
            <if ${field.helpText}>
              <div class="preview__help">${field.helpText}</div>
            </if>
          </div>
        `;

      case 'file':
        return html`
          <div class="preview__field">
            <label class="preview__label">
              ${field.label}
              <if ${field.required}><span class="preview__required">*</span></if>
            </label>
            <input class="preview__file" type="file" accept="${field.accept || ''}" />
            <if ${field.helpText}>
              <div class="preview__help">${field.helpText}</div>
            </if>
          </div>
        `;

      case 'signature':
        return html`
          <div class="preview__field">
            <label class="preview__label">
              ${field.label}
              <if ${field.required}><span class="preview__required">*</span></if>
            </label>
            <div class="preview__signature">Click to sign</div>
            <if ${field.helpText}>
              <div class="preview__help">${field.helpText}</div>
            </if>
          </div>
        `;

      default:
        return html``;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-form-builder': SniceFormBuilder;
  }
}
