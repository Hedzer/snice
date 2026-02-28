import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/form-builder/snice-form-builder';
import type { SniceFormBuilderElement, FormSchema, FormField } from '../../components/form-builder/snice-form-builder.types';

describe('snice-form-builder', () => {
  let fb: SniceFormBuilderElement;

  afterEach(() => {
    if (fb) {
      removeComponent(fb as HTMLElement);
    }
  });

  it('should render', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    expect(fb).toBeTruthy();
  });

  it('should have default properties', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    expect(fb.schema).toEqual({ fields: [] });
    expect(fb.mode).toBe('edit');
    expect(fb.fieldTypes.length).toBeGreaterThan(0);
    expect(fb.fieldTypes).toContain('text');
    expect(fb.fieldTypes).toContain('email');
    expect(fb.fieldTypes).toContain('select');
  });

  it('should add a field', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('text');
    await wait();

    expect(fb.schema.fields.length).toBe(1);
    expect(fb.schema.fields[0].type).toBe('text');
    expect(fb.schema.fields[0].label).toBe('Text');
    expect(fb.schema.fields[0].id).toBeTruthy();
  });

  it('should add multiple fields', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('text');
    fb.addField('email');
    fb.addField('number');
    await wait();

    expect(fb.schema.fields.length).toBe(3);
    expect(fb.schema.fields[0].type).toBe('text');
    expect(fb.schema.fields[1].type).toBe('email');
    expect(fb.schema.fields[2].type).toBe('number');
  });

  it('should remove a field', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('text');
    fb.addField('email');
    await wait();

    const fieldId = fb.schema.fields[0].id;
    fb.removeField(fieldId);
    await wait();

    expect(fb.schema.fields.length).toBe(1);
    expect(fb.schema.fields[0].type).toBe('email');
  });

  it('should set schema', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');

    const schema: FormSchema = {
      title: 'Test Form',
      description: 'A test form',
      fields: [
        { id: 'f1', type: 'text', label: 'Name', required: true },
        { id: 'f2', type: 'email', label: 'Email' },
      ],
    };

    fb.setSchema(schema);
    await wait();

    expect(fb.schema.title).toBe('Test Form');
    expect(fb.schema.description).toBe('A test form');
    expect(fb.schema.fields.length).toBe(2);
    expect(fb.schema.fields[0].label).toBe('Name');
  });

  it('should get schema (deep copy)', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('text');
    await wait();

    const schema = fb.getSchema();
    expect(schema.fields.length).toBe(1);

    // Verify it's a deep copy
    schema.fields[0].label = 'Modified';
    expect(fb.schema.fields[0].label).not.toBe('Modified');
  });

  it('should switch to preview mode', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('text');
    fb.preview();
    await wait();

    expect(fb.mode).toBe('preview');
  });

  it('should create select field with default options', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('select');
    await wait();

    const field = fb.schema.fields[0];
    expect(field.type).toBe('select');
    expect(field.options).toBeDefined();
    expect(field.options!.length).toBe(2);
  });

  it('should create radio field with default options', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('radio');
    await wait();

    const field = fb.schema.fields[0];
    expect(field.type).toBe('radio');
    expect(field.options).toBeDefined();
    expect(field.options!.length).toBe(2);
  });

  it('should create checkbox field with default options', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('checkbox');
    await wait();

    const field = fb.schema.fields[0];
    expect(field.type).toBe('checkbox');
    expect(field.options).toBeDefined();
    expect(field.options!.length).toBe(2);
  });

  it('should dispatch schema-change event on addField', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');

    const handler = vi.fn();
    fb.addEventListener('schema-change', handler as EventListener);

    fb.addField('text');
    await wait();

    expect(handler).toHaveBeenCalled();
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.schema.fields.length).toBe(1);
  });

  it('should dispatch field-add event', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');

    const handler = vi.fn();
    fb.addEventListener('field-add', handler as EventListener);

    fb.addField('email');
    await wait();

    expect(handler).toHaveBeenCalled();
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.field.type).toBe('email');
  });

  it('should dispatch field-remove event', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('text');
    await wait();

    const handler = vi.fn();
    fb.addEventListener('field-remove', handler as EventListener);

    fb.removeField(fb.schema.fields[0].id);
    await wait();

    expect(handler).toHaveBeenCalled();
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.field.type).toBe('text');
  });

  it('should support all field types', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');

    const types = ['text', 'number', 'email', 'phone', 'select', 'date', 'checkbox', 'radio', 'file', 'signature', 'section', 'paragraph'] as const;

    for (const type of types) {
      fb.addField(type);
    }
    await wait();

    expect(fb.schema.fields.length).toBe(types.length);
    types.forEach((type, i) => {
      expect(fb.schema.fields[i].type).toBe(type);
    });
  });

  it('should create section field with correct label', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('section');
    await wait();

    expect(fb.schema.fields[0].label).toBe('Section Title');
  });

  it('should create paragraph field with default content', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('paragraph');
    await wait();

    expect(fb.schema.fields[0].content).toBeTruthy();
  });

  it('should not remove non-existent field', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.addField('text');
    await wait();

    fb.removeField('nonexistent');
    await wait();

    expect(fb.schema.fields.length).toBe(1);
  });

  it('should set mode attribute', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder', {
      mode: 'preview',
    });
    expect(fb.mode).toBe('preview');
  });

  it('should accept custom field-types', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    fb.fieldTypes = ['text', 'email', 'select'];
    await wait();

    expect(fb.fieldTypes.length).toBe(3);
  });

  it('should render shadow DOM structure in edit mode', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');
    await wait();

    const shadowRoot = fb.shadowRoot!;
    expect(shadowRoot.querySelector('.mode-toggle')).toBeTruthy();
    expect(shadowRoot.querySelector('.toolbar')).toBeTruthy();
    expect(shadowRoot.querySelector('.canvas')).toBeTruthy();
    expect(shadowRoot.querySelector('.properties')).toBeTruthy();
  });

  it('should render preview structure in preview mode', async () => {
    fb = await createComponent<SniceFormBuilderElement>('snice-form-builder');

    fb.setSchema({
      title: 'Contact Form',
      fields: [{ id: 'f1', type: 'text', label: 'Name' }],
    });
    fb.mode = 'preview';
    await wait();

    const shadowRoot = fb.shadowRoot!;
    expect(shadowRoot.querySelector('.preview')).toBeTruthy();
    expect(shadowRoot.querySelector('.toolbar')).toBeFalsy();
  });
});
