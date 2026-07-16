type LabelAssociationRegistry = {
  associations: Set<FormLabelAssociation>;
  observer: MutationObserver;
};

type LabelAssociationRoot = Document | ShadowRoot;

const labelAssociationRegistries = new WeakMap<LabelAssociationRoot, LabelAssociationRegistry>();

function normalizeAccessibleText(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function nodeContains(node: Node, candidate: Node): boolean {
  return node === candidate || (node.nodeType === Node.ELEMENT_NODE && (node as Element).contains(candidate));
}

function labelRoot(host: HTMLElement): LabelAssociationRoot | null {
  const root = host.getRootNode();
  if (root.nodeType === Node.DOCUMENT_NODE) return root as Document;
  if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) return root;
  return null;
}

function rootElementById(label: HTMLLabelElement, id: string): HTMLElement | null {
  const root = label.getRootNode() as Document | ShadowRoot;
  if ('getElementById' in root) return root.getElementById(id) as HTMLElement | null;
  return null;
}

function collectLabelText(node: Node, host: HTMLElement): string {
  if (node === host) return '';
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as HTMLElement;
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return '';
  if (['script', 'style', 'template'].includes(element.localName)) return '';
  if (element.localName === 'br') return ' ';
  if (element.localName === 'img') return element.getAttribute('alt') || '';

  return Array.from(element.childNodes)
    .map(child => collectLabelText(child, host))
    .join(' ');
}

function labelAccessibleText(label: HTMLLabelElement, host: HTMLElement): string {
  const labelledBy = label.getAttribute('aria-labelledby');
  if (labelledBy) {
    const referenced = labelledBy
      .split(/\s+/u)
      .map(id => rootElementById(label, id))
      .filter((element): element is HTMLElement => Boolean(element) && element !== label)
      .map(element => collectLabelText(element, host));
    const text = normalizeAccessibleText(referenced.join(' '));
    if (text) return text;
  }

  if (label.hasAttribute('aria-label')) {
    return normalizeAccessibleText(label.getAttribute('aria-label') || '');
  }

  const text = normalizeAccessibleText(collectLabelText(label, host));
  return text || normalizeAccessibleText(label.getAttribute('title') || '');
}

function ensureLabelAssociationRegistry(root: LabelAssociationRoot): LabelAssociationRegistry | null {
  const observedNode = root.nodeType === Node.DOCUMENT_NODE
    ? (root as Document).documentElement
    : root;
  if (!observedNode || typeof MutationObserver === 'undefined') return null;

  const existing = labelAssociationRegistries.get(root);
  if (existing) return existing;

  const associations = new Set<FormLabelAssociation>();
  const observer = new MutationObserver(mutations => {
    for (const association of associations) {
      if (mutations.some(mutation => association.isAffectedBy(mutation))) {
        association.sync();
      }
    }
  });
  observer.observe(observedNode, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['for', 'id', 'aria-label', 'aria-labelledby', 'aria-hidden', 'hidden', 'alt', 'title']
  });

  const registry = { associations, observer };
  labelAssociationRegistries.set(root, registry);
  return registry;
}

/**
 * Bridges native FACE label association into a component's shadow focus target.
 *
 * Associated label text becomes the shadow control's accessible name, and the
 * browser-generated click on a form-associated custom-element host focuses that
 * control. One shared, filtered observer per document or shadow root keeps explicit, wrapping,
 * multiple, and dynamic labels current without installing an observer per
 * component instance. Association is also resolved from the current tree because
 * Firefox and WebKit can retain stale `ElementInternals.labels` entries after a
 * dynamic `id`/`for` change.
 */
export class FormLabelAssociation {
  private connected = false;
  private currentLabels: HTMLLabelElement[] = [];
  private currentNamingNodes: HTMLElement[] = [];
  private referencedIds = new Set<string>();
  private registry?: LabelAssociationRegistry;
  private registryRoot?: LabelAssociationRoot;

  constructor(
    private readonly host: HTMLElement,
    private readonly getInternals: () => ElementInternals | undefined,
    private readonly getTarget: () => HTMLElement | undefined,
    private readonly getFallbackName: () => string
  ) {}

  get labels(): NodeList | null {
    const root = this.host.getRootNode() as Document | ShadowRoot;
    if (this.host.id && 'querySelectorAll' in root) {
      try {
        const id = CSS.escape(this.host.id);
        const tag = CSS.escape(this.host.localName);
        return root.querySelectorAll(
          `label[for="${id}"], label:not([for]):has(${tag}#${id})`
        );
      } catch {
        // Fall through for DOM implementations without :has() or CSS.escape().
      }
    }
    return this.getInternals()?.labels ?? null;
  }

  get accessibleName(): string {
    const labels = this.resolveLabels();
    if (labels.length > 0) {
      return normalizeAccessibleText(labels.map(label => labelAccessibleText(label, this.host)).join(' '));
    }
    return normalizeAccessibleText(this.getFallbackName());
  }

  connect() {
    if (this.connected) return;
    this.connected = true;
    this.host.addEventListener('click', this.handleHostActivation);
    this.bindRegistry();
    this.sync();
  }

  disconnect() {
    if (!this.connected) return;
    this.connected = false;
    this.host.removeEventListener('click', this.handleHostActivation);
    this.releaseRegistry();
    this.currentLabels = [];
    this.currentNamingNodes = [];
    this.referencedIds.clear();
  }

  sync() {
    if (this.connected) this.bindRegistry();
    this.currentLabels = this.resolveLabels();
    this.currentNamingNodes = [...this.currentLabels];
    this.referencedIds.clear();
    for (const label of this.currentLabels) {
      for (const id of (label.getAttribute('aria-labelledby') || '').split(/\s+/u).filter(Boolean)) {
        this.referencedIds.add(id);
        const referenced = rootElementById(label, id);
        if (referenced && referenced !== label) this.currentNamingNodes.push(referenced);
      }
    }
    const name = this.currentLabels.length > 0
      ? normalizeAccessibleText(this.currentLabels.map(label => labelAccessibleText(label, this.host)).join(' '))
      : normalizeAccessibleText(this.getFallbackName());
    this.getTarget()?.setAttribute('aria-label', name);
  }

  isAffectedBy(mutation: MutationRecord): boolean {
    if (mutation.type === 'attributes') {
      if (mutation.target === this.host && mutation.attributeName === 'id') return true;
      const target = mutation.target as HTMLElement;
      if (target.localName === 'label' && mutation.attributeName === 'for') {
        return this.currentLabels.includes(target as HTMLLabelElement)
          || (Boolean(this.host.id) && (target as HTMLLabelElement).htmlFor === this.host.id);
      }
      if (mutation.attributeName === 'id' && this.referencedIds.has(target.id)) return true;
      return this.currentNamingNodes.some(node => node === target || node.contains(target));
    }

    if (this.currentNamingNodes.some(node => node === mutation.target || node.contains(mutation.target))) {
      return true;
    }

    if (mutation.type === 'childList') {
      return [...mutation.addedNodes, ...mutation.removedNodes].some(node => {
        if (nodeContains(node, this.host) || nodeContains(this.host, node)) return true;
        if (this.currentNamingNodes.some(current => nodeContains(node, current))) return true;
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        const element = node as Element;
        const labels = element.localName === 'label'
          ? [element as HTMLLabelElement]
          : Array.from(element.querySelectorAll('label'));
        if (labels.some(label => label.hasAttribute('for')
          ? Boolean(this.host.id) && label.htmlFor === this.host.id
          : label.contains(this.host))) return true;
        return [element, ...Array.from(element.querySelectorAll('[id]'))]
          .some(candidate => this.referencedIds.has(candidate.id));
      });
    }

    return false;
  }

  private handleHostActivation = (event: MouseEvent) => {
    if (event.composedPath()[0] !== this.host) return;
    this.currentLabels = this.resolveLabels();
    if (this.currentLabels.length === 0) return;
    this.getTarget()?.focus();
  };

  private bindRegistry() {
    const root = labelRoot(this.host);
    if (root === this.registryRoot) return;
    this.releaseRegistry();
    if (!root) return;
    this.registryRoot = root;
    this.registry = ensureLabelAssociationRegistry(root) || undefined;
    this.registry?.associations.add(this);
  }

  private releaseRegistry() {
    this.registry?.associations.delete(this);
    if (this.registry && this.registry.associations.size === 0 && this.registryRoot) {
      this.registry.observer.disconnect();
      labelAssociationRegistries.delete(this.registryRoot);
    }
    this.registry = undefined;
    this.registryRoot = undefined;
  }

  private resolveLabels(): HTMLLabelElement[] {
    const root = this.host.getRootNode() as Document | ShadowRoot;
    if ('querySelectorAll' in root) {
      return Array.from(root.querySelectorAll('label')).filter(label => {
        if (label.hasAttribute('for')) {
          return Boolean(this.host.id) && label.htmlFor === this.host.id;
        }
        return label.contains(this.host);
      });
    }
    return Array.from(this.getInternals()?.labels || []) as HTMLLabelElement[];
  }
}
