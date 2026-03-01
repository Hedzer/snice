import { element, property, render, styles, html, css, dispatch, watch } from 'snice';
import cssContent from './snice-data-card.css?inline';
import type { DataCardField, DataCardVariant, SniceDataCardElement } from './snice-data-card.types';

@element('snice-data-card')
export class SniceDataCard extends HTMLElement implements SniceDataCardElement {
  @property({ type: Array, attribute: false })
  fields: DataCardField[] = [];

  @property({ type: Boolean })
  editable = false;

  @property()
  variant: DataCardVariant = 'default';

  private editingField: string | null = null;
  private editValue: string | number = '';

  @dispatch('field-change', { bubbles: true, composed: true })
  private emitFieldChange(field: DataCardField, value: string | number, previousValue: string | number) {
    return { field, value, previousValue };
  }

  @dispatch('field-save', { bubbles: true, composed: true })
  private emitFieldSave(field: DataCardField, value: string | number) {
    return { field, value };
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  getValues(): Record<string, string | number> {
    const values: Record<string, string | number> = {};
    for (const field of this.fields) {
      values[field.label] = field.value;
    }
    return values;
  }

  setValues(data: Record<string, string | number>): void {
    const updatedFields = this.fields.map(field => {
      if (data[field.label] !== undefined) {
        return { ...field, value: data[field.label] };
      }
      return field;
    });
    this.fields = updatedFields;
  }

  private startEdit(field: DataCardField) {
    this.editingField = field.label;
    this.editValue = field.value;
    // Trigger re-render by assigning fields to itself
    this.fields = [...this.fields];
  }

  private handleInput(e: Event) {
    this.editValue = (e.target as HTMLInputElement).value;
  }

  private handleSave(field: DataCardField) {
    const previousValue = field.value;
    const newValue = this.editValue;
    this.editingField = null;

    // Update the field in the array
    this.fields = this.fields.map(f => {
      if (f.label === field.label) {
        return { ...f, value: newValue };
      }
      return f;
    });

    this.emitFieldChange(field, newValue, previousValue);
    this.emitFieldSave({ ...field, value: newValue }, newValue);
  }

  private handleKeydown(e: KeyboardEvent, field: DataCardField) {
    if (e.key === 'Enter') {
      this.handleSave(field);
    } else if (e.key === 'Escape') {
      this.editingField = null;
      this.fields = [...this.fields];
    }
  }

  private toggleEditMode() {
    this.editable = !this.editable;
    if (!this.editable) {
      this.editingField = null;
    }
  }

  private getGroups(): { name: string | null; fields: DataCardField[] }[] {
    const groups: Map<string | null, DataCardField[]> = new Map();
    for (const field of this.fields) {
      const group = field.group || null;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(field);
    }
    return Array.from(groups.entries()).map(([name, fields]) => ({ name, fields }));
  }

  @render()
  render() {
    const groups = this.getGroups();

    return html/*html*/`
      <div class="data-card" part="container">
        <div class="data-card__header" part="header">
          <slot name="header">
            <span class="data-card__title" part="title"><slot name="title"></slot></span>
          </slot>
          <button
            class="data-card__edit-toggle ${this.editable ? 'data-card__edit-toggle--active' : ''}"
            part="edit-toggle"
            @click=${() => this.toggleEditMode()}
            style="display: ${this.fields.some(f => f.editable !== false) ? '' : 'none'}">
            ${this.editable ? '✓ Done' : '✎ Edit'}
          </button>
        </div>

        ${groups.map(group => this.renderGroup(group))}
      </div>
    `;
  }

  private renderGroup(group: { name: string | null; fields: DataCardField[] }) {
    return html/*html*/`
      <div class="data-card__group" part="group">
        <if ${group.name}>
          <div class="data-card__group-title" part="group-title">${group.name}</div>
        </if>
        ${group.fields.map((field: DataCardField) => this.renderField(field))}
      </div>
    `;
  }

  private renderField(field: DataCardField) {
    const isEditing = this.editingField === field.label;
    const canEdit = this.editable && (field.editable !== false);

    return html/*html*/`
      <div class="field" part="field">
        <if ${field.icon}>
          <span class="field__icon" part="field-icon">${field.icon}</span>
        </if>
        <span class="field__label" part="field-label">${field.label}</span>
        <if ${isEditing}>
          <input
            class="field__input"
            part="field-input"
            .value="${String(this.editValue)}"
            @input=${(e: Event) => this.handleInput(e)}
            @keydown=${(e: KeyboardEvent) => this.handleKeydown(e, field)}
          />
          <button class="field__save-btn" part="field-save" @click=${() => this.handleSave(field)}>Save</button>
        </if>
        <if ${!isEditing}>
          ${this.renderValue(field, canEdit)}
        </if>
      </div>
    `;
  }

  private renderValue(field: DataCardField, canEdit: boolean) {
    const type = field.type || 'text';

    if (type === 'link') {
      return html/*html*/`
        <a class="field__value field__value--link" part="field-value" href="${field.href || '#'}" target="_blank" rel="noopener">${field.value}</a>
      `;
    }

    if (type === 'badge') {
      const badgeVariant = field.badgeVariant || 'default';
      return html/*html*/`
        <span class="field__value field__value--badge field__value--badge-${badgeVariant}" part="field-value">${field.value}</span>
        <if ${canEdit}>
          <button class="field__save-btn" part="field-edit" @click=${() => this.startEdit(field)} style="background:transparent;color:var(--snice-color-text-tertiary,rgb(115 115 115));border:1px solid var(--snice-color-border,rgb(226 226 226))">✎</button>
        </if>
      `;
    }

    if (type === 'date') {
      return html/*html*/`
        <span class="field__value field__value--date" part="field-value" @click=${() => canEdit && this.startEdit(field)} style="${canEdit ? 'cursor:pointer' : ''}">${field.value}</span>
        <if ${canEdit}>
          <button class="field__save-btn" part="field-edit" @click=${() => this.startEdit(field)} style="background:transparent;color:var(--snice-color-text-tertiary,rgb(115 115 115));border:1px solid var(--snice-color-border,rgb(226 226 226))">✎</button>
        </if>
      `;
    }

    if (type === 'currency') {
      return html/*html*/`
        <span class="field__value field__value--currency" part="field-value" @click=${() => canEdit && this.startEdit(field)} style="${canEdit ? 'cursor:pointer' : ''}">${field.value}</span>
        <if ${canEdit}>
          <button class="field__save-btn" part="field-edit" @click=${() => this.startEdit(field)} style="background:transparent;color:var(--snice-color-text-tertiary,rgb(115 115 115));border:1px solid var(--snice-color-border,rgb(226 226 226))">✎</button>
        </if>
      `;
    }

    // Default text type
    return html/*html*/`
      <span class="field__value" part="field-value" @click=${() => canEdit && this.startEdit(field)} style="${canEdit ? 'cursor:pointer' : ''}">${field.value}</span>
      <if ${canEdit}>
        <button class="field__save-btn" part="field-edit" @click=${() => this.startEdit(field)} style="background:transparent;color:var(--snice-color-text-tertiary,rgb(115 115 115));border:1px solid var(--snice-color-border,rgb(226 226 226))">✎</button>
      </if>
    `;
  }
}
