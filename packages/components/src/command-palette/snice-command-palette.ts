import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-command-palette.css?inline';
import type {
  CommandItem,
  SniceCommandPaletteElement,
  CommandSelectDetail,
  CommandExecuteDetail,
  CommandSearchDetail,
  CommandPaletteOpenDetail,
  CommandPaletteCloseDetail
} from './snice-command-palette.types';

@element('snice-command-palette')
export class SniceCommandPalette extends HTMLElement implements SniceCommandPaletteElement {
  @property({ type: Boolean })
  open = false;

  @property({ type: Array, attribute: false })
  commands: CommandItem[] = [];

  @property({  })
  placeholder = 'Type a command or search...';

  @property({ attribute: 'no-results-text' })
  noResultsText = 'No results found';

  @property({ type: Number, attribute: 'max-results' })
  maxResults = 50;

  @property({ type: Boolean, attribute: 'show-recent-commands' })
  showRecentCommands = true;

  @property({ type: Number, attribute: 'recent-commands-limit' })
  recentCommandsLimit = 5;

  @property({ type: Boolean, attribute: 'case-sensitive' })
  caseSensitive = false;

  @query('.command-palette__input')
  searchInput?: HTMLInputElement;

  @property({ attribute: false })
  private searchQuery = '';
  @property({ type: Number, attribute: false })
  private activeIndex = 0;
  @property({ type: Array, attribute: false })
  private filteredCommands: CommandItem[] = [];
  @property({ type: Array, attribute: false })
  private recentCommands: string[] = [];
  private commandMap = new Map<string, CommandItem>();

  private boundKeydown = this.handleGlobalKeydown.bind(this);
  private listboxId = `snice-command-palette-list-${Math.random().toString(36).slice(2, 10)}`;

  connectedCallback() {
    // Doc: "Cmd+K / Ctrl+K - Toggle palette" is a GLOBAL shortcut. While the
    // palette is closed nothing inside it can hold focus, so the listener must
    // live on the document, not on this element.
    document.addEventListener('keydown', this.boundKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.boundKeydown);
  }

  @ready()
  init() {
    this.buildCommandMap();
    this.loadRecentCommands();
  }

  @watch('commands')
  handleCommandsChange() {
    this.buildCommandMap();
    this.updateFilteredCommands();
  }

  @watch('open', { immediate: false })
  handleOpenChange() {
    if (this.open) {
      this.dispatchOpenEvent();
      this.updateFilteredCommands();
      setTimeout(() => {
        this.searchInput?.focus();
      }, 100);
    } else {
      this.dispatchCloseEvent();
      this.searchQuery = '';
      this.activeIndex = 0;
    }
  }

  private buildCommandMap() {
    this.commandMap.clear();
    for (const command of this.commands) {
      this.commandMap.set(command.id, command);
    }
  }

  private loadRecentCommands() {
    try {
      const stored = localStorage.getItem('snice-command-palette-recent');
      if (stored) {
        this.recentCommands = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private saveRecentCommands() {
    try {
      localStorage.setItem('snice-command-palette-recent', JSON.stringify(this.recentCommands));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private addToRecentCommands(commandId: string) {
    // Remove if already exists
    this.recentCommands = this.recentCommands.filter(id => id !== commandId);
    // Add to front
    this.recentCommands.unshift(commandId);
    // Limit size
    this.recentCommands = this.recentCommands.slice(0, this.recentCommandsLimit);
    this.saveRecentCommands();
  }

  private recentItems(): CommandItem[] {
    if (!this.showRecentCommands || this.searchQuery.trim()) return [];
    return this.recentCommands
      .map(id => this.commandMap.get(id))
      .filter(Boolean) as CommandItem[];
  }

  private updateFilteredCommands() {
    if (!this.searchQuery.trim()) {
      // No query: the recently used commands lead the list under their own
      // "Recent" group, and every other command stays reachable below them.
      const recents = this.recentItems();
      if (recents.length) {
        const recentIds = new Set(recents.map(command => command.id));
        const rest = this.commands
          .filter(command => !recentIds.has(command.id))
          .slice(0, Math.max(0, this.maxResults - recents.length));
        this.filteredCommands = [...recents, ...rest];
      } else {
        this.filteredCommands = this.commands.slice(0, this.maxResults);
      }
    } else {
      // Filter commands based on search query
      const query = this.caseSensitive ? this.searchQuery : this.searchQuery.toLowerCase();
      this.filteredCommands = this.commands
        .filter(cmd => {
          if (cmd.disabled) return false;
          const label = this.caseSensitive ? cmd.label : cmd.label.toLowerCase();
          const description = this.caseSensitive ? (cmd.description || '') : (cmd.description || '').toLowerCase();
          const category = this.caseSensitive ? (cmd.category || '') : (cmd.category || '').toLowerCase();
          return label.includes(query) || description.includes(query) || category.includes(query);
        })
        .slice(0, this.maxResults);
    }

    this.activeIndex = 0;
    this.dispatchSearchEvent();
  }

  /**
   * Whether a keydown's target is an editable element the PAGE owns. The
   * global chord stays available everywhere inside this palette (shadow events
   * retarget to the host), but a page's own text field may need Cmd+K itself.
   */
  private isForeignEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.closest('snice-command-palette')) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      || target.isContentEditable;
  }

  private handleGlobalKeydown(e: KeyboardEvent) {
    // Command+K or Ctrl+K to toggle palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      if (this.isForeignEditableTarget(e.target)) return;
      e.preventDefault();
      this.toggle();
      return;
    }

    if (!this.open) return;

    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    // Arrow navigation. Doc: `command-select` -> "Command highlighted", so
    // every highlight change announces the newly highlighted command.
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.setActiveIndex(Math.min(this.activeIndex + 1, this.filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.setActiveIndex(Math.max(this.activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = this.filteredCommands[this.activeIndex];
      if (command && !command.disabled) {
        this.selectCommand(command);
      }
    }
  }

  private setActiveIndex(index: number): void {
    if (index === this.activeIndex) return;
    this.activeIndex = index;
    const command = this.filteredCommands[index];
    if (command) {
      this.dispatchSelectEvent(command);
    }
  }

  private handleSearchInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.updateFilteredCommands();
  }

  private handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      this.close();
    }
  }

  private handleItemClick(command: CommandItem) {
    if (command.disabled) return;
    this.selectCommand(command);
  }

  private selectCommand(command: CommandItem) {
    this.dispatchSelectEvent(command);
    this.addToRecentCommands(command.id);

    if (command.action) {
      const result = command.action();
      if (result instanceof Promise) {
        result.then(() => this.dispatchExecuteEvent(command));
      } else {
        this.dispatchExecuteEvent(command);
      }
    } else {
      this.dispatchExecuteEvent(command);
    }

    this.close();
  }

  @dispatch('command-palette-open', { bubbles: true, composed: true })
  private dispatchOpenEvent(): CommandPaletteOpenDetail {
    return { palette: this };
  }

  @dispatch('command-palette-close', { bubbles: true, composed: true })
  private dispatchCloseEvent(): CommandPaletteCloseDetail {
    return { palette: this };
  }

  @dispatch('command-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(command: CommandItem): CommandSelectDetail {
    return { command, palette: this };
  }

  @dispatch('command-execute', { bubbles: true, composed: true })
  private dispatchExecuteEvent(command: CommandItem): CommandExecuteDetail {
    return { command, palette: this };
  }

  @dispatch('command-search', { bubbles: true, composed: true })
  private dispatchSearchEvent(): CommandSearchDetail {
    return { query: this.searchQuery, results: this.filteredCommands, palette: this };
  }

  private optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  private renderGroups(recents: CommandItem[], categories: string[], grouped: Map<string, CommandItem[]>): unknown {
    const out: unknown[] = [];
    if (recents.length) {
      out.push(html/*html*/`<div class="command-palette__category" part="category">Recent</div>`);
      for (const command of recents) {
        out.push(this.renderItem(command));
      }
    }
    for (const category of categories) {
      const commands = grouped.get(category) || [];
      if (category) {
        out.push(html/*html*/`<div class="command-palette__category" part="category">${category}</div>`);
      }
      for (const command of commands) {
        out.push(this.renderItem(command));
      }
    }
    return out;
  }

  private renderItem(command: CommandItem): unknown {
    const globalIndex = this.filteredCommands.indexOf(command);
    const itemClasses = [
      'command-palette__item',
      globalIndex === this.activeIndex ? 'command-palette__item--active' : '',
      command.disabled ? 'command-palette__item--disabled' : ''
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <button
        class="${itemClasses}"
        part="item"
        role="option"
        id="${this.optionId(globalIndex)}"
        @click="${() => this.handleItemClick(command)}"
        @mouseenter="${() => { this.activeIndex = globalIndex; }}">

        <if ${command.icon || command.iconImage}>
          <div class="command-palette__item-icon" part="item-icon">
            <if ${command.iconImage}>
              <img
                class="command-palette__item-icon-image"
                src="${command.iconImage}"
                alt=""
                part="item-icon-image"
              />
            </if>
            <if ${!command.iconImage && command.icon}>
              ${renderIcon(command.icon!, 'command-palette__item-icon-glyph')}
            </if>
          </div>
        </if>

        <div class="command-palette__item-content" part="item-content">
          <div class="command-palette__item-label" part="item-label">
            ${command.label}
          </div>
          <if ${command.description}>
            <div class="command-palette__item-description" part="item-description">
              ${command.description}
            </div>
          </if>
        </div>

        <if ${command.shortcut}>
          <div class="command-palette__item-shortcut" part="item-shortcut">
            ${command.shortcut}
          </div>
        </if>
      </button>
    `;
  }

  @render()
  render() {
    const paletteClasses = [
      'command-palette',
      this.open ? 'command-palette--open' : ''
    ].filter(Boolean).join(' ');

    // Group commands by category. The recent commands lead the list under
    // their own "Recent" header; the rest keep their documented grouping.
    const recents = this.recentItems();
    const rest = recents.length ? this.filteredCommands.slice(recents.length) : this.filteredCommands;
    const grouped = new Map<string, CommandItem[]>();
    for (const command of rest) {
      const category = command.category || '';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(command);
    }

    const categories = Array.from(grouped.keys());

    return html/*html*/`
      <div class="${paletteClasses}">
        <if ${this.open}>
          <div class="command-palette__backdrop" @click="${(e: MouseEvent) => this.handleBackdropClick(e)}"></div>

          <div class="command-palette__container" part="container"
               role="dialog" aria-modal="true" aria-label="Command palette">
            <div class="command-palette__search" part="search">
              <input
                class="command-palette__input"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="${this.listboxId}"
                aria-activedescendant="${this.filteredCommands.length ? this.optionId(this.activeIndex) : ''}"
                aria-autocomplete="list"
                aria-label="${this.placeholder}"
                placeholder="${this.placeholder}"
                .value="${this.searchQuery}"
                @input="${(e: Event) => this.handleSearchInput(e)}"
                part="input"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <div class="command-palette__results" part="results" id="${this.listboxId}" role="listbox">
              <if ${this.filteredCommands.length === 0}>
                <div class="command-palette__empty" part="empty">${this.noResultsText}</div>
              </if>

              <if ${this.filteredCommands.length > 0}>
                ${this.renderGroups(recents, categories, grouped)}
              </if>
            </div>
          </div>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Public API
  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  toggle() {
    this.open = !this.open;
  }

  addCommand(command: CommandItem) {
    this.commands = [...this.commands, command];
  }

  removeCommand(id: string) {
    this.commands = this.commands.filter(cmd => cmd.id !== id);
  }

  executeCommand(id: string) {
    const command = this.commandMap.get(id);
    if (command && !command.disabled) {
      this.selectCommand(command);
    }
  }

  clearSearch() {
    this.searchQuery = '';
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.updateFilteredCommands();
  }

  focus() {
    this.searchInput?.focus();
  }
}
