import { element, property, query, watch, dispatch, ready, render, styles, html, css } from 'snice';
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

  @property({ type: Array })
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

  private searchQuery = '';
  private activeIndex = 0;
  private filteredCommands: CommandItem[] = [];
  private recentCommands: string[] = [];
  private commandMap = new Map<string, CommandItem>();

  connectedCallback() {
    this.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this.handleGlobalKeydown.bind(this));
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

  @watch('open')
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

  private updateFilteredCommands() {
    if (!this.searchQuery.trim()) {
      // Show recent commands when no search query
      if (this.showRecentCommands) {
        this.filteredCommands = this.recentCommands
          .map(id => this.commandMap.get(id))
          .filter(Boolean) as CommandItem[];
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

  private handleGlobalKeydown(e: KeyboardEvent) {
    // Command+K or Ctrl+K to toggle palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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

    // Arrow navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.filteredCommands.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = this.filteredCommands[this.activeIndex];
      if (command && !command.disabled) {
        this.selectCommand(command);
      }
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

  @dispatch('@snice/command-palette-open', { bubbles: true, composed: true })
  private dispatchOpenEvent(): CommandPaletteOpenDetail {
    return { palette: this };
  }

  @dispatch('@snice/command-palette-close', { bubbles: true, composed: true })
  private dispatchCloseEvent(): CommandPaletteCloseDetail {
    return { palette: this };
  }

  @dispatch('@snice/command-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(command: CommandItem): CommandSelectDetail {
    return { command, palette: this };
  }

  @dispatch('@snice/command-execute', { bubbles: true, composed: true })
  private dispatchExecuteEvent(command: CommandItem): CommandExecuteDetail {
    return { command, palette: this };
  }

  @dispatch('@snice/command-search', { bubbles: true, composed: true })
  private dispatchSearchEvent(): CommandSearchDetail {
    return { query: this.searchQuery, results: this.filteredCommands, palette: this };
  }

  @render()
  render() {
    const paletteClasses = [
      'command-palette',
      this.open ? 'command-palette--open' : ''
    ].filter(Boolean).join(' ');

    // Group commands by category
    const grouped = new Map<string, CommandItem[]>();
    for (const command of this.filteredCommands) {
      const category = command.category || '';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(command);
    }

    const categories = Array.from(grouped.keys());

    return html`
      <div class="${paletteClasses}">
        <if ${this.open}>
          <div class="command-palette__backdrop" @click="${(e: MouseEvent) => this.handleBackdropClick(e)}"></div>

          <div class="command-palette__container" part="container">
            <div class="command-palette__search" part="search">
              <input
                class="command-palette__input"
                type="text"
                placeholder="${this.placeholder}"
                .value="${this.searchQuery}"
                @input="${(e: Event) => this.handleSearchInput(e)}"
                part="input"
                autocomplete="off"
                spellcheck="false"
              />
            </div>

            <div class="command-palette__results" part="results">
              <if ${this.filteredCommands.length === 0}>
                <div class="command-palette__empty" part="empty">${this.noResultsText}</div>
              </if>

              <if ${this.filteredCommands.length > 0}>
                ${categories.map(category => {
                  const commands = grouped.get(category) || [];
                  return html`
                    <if ${category}>
                      <div class="command-palette__category" part="category">${category}</div>
                    </if>
                    ${commands.map((command, index) => {
                      const globalIndex = this.filteredCommands.indexOf(command);
                      const itemClasses = [
                        'command-palette__item',
                        globalIndex === this.activeIndex ? 'command-palette__item--active' : '',
                        command.disabled ? 'command-palette__item--disabled' : ''
                      ].filter(Boolean).join(' ');

                      return html`
                        <button
                          class="${itemClasses}"
                          part="item"
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
                                ${command.icon}
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
                    })}
                  `;
                })}
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
