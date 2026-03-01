import { element, property, render, styles, dispatch, query, watch, ready, dispose, html, css } from 'snice';
import cssContent from './snice-mentions.css?inline';
import type {
  MentionUser,
  Mention,
  SniceMentionsElement,
  MentionAddDetail,
  MentionRemoveDetail,
  ValueChangeDetail,
} from './snice-mentions.types';

/** Mention marker format: @[Name](id) */
const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

@element('snice-mentions')
export class SniceMentions extends HTMLElement implements SniceMentionsElement {
  @property()
  value = '';

  @property({ type: Array, attribute: false })
  users: MentionUser[] = [];

  @property()
  placeholder = 'Type @ to mention someone...';

  @property({ type: Boolean })
  readonly = false;

  @property()
  trigger = '@';

  @query('.mentions__textarea')
  private textarea?: HTMLTextAreaElement;

  private showDropdown = false;
  private filteredUsers: MentionUser[] = [];
  private highlightedIndex = -1;
  private queryStart = -1;
  private currentQuery = '';
  private previousMentionIds = new Set<string>();

  @ready()
  init() {
    document.addEventListener('click', this.handleDocumentClick);
    this.previousMentionIds = new Set(this.getMentions().map(m => m.id));
  }

  @dispose()
  cleanup() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  private handleDocumentClick = (e: Event) => {
    if (!this.contains(e.target as Node)) {
      this.showDropdown = false;
    }
  };

  @watch('value')
  handleValueChange() {
    this.detectMentionChanges();
    this.emitValueChange({
      value: this.value,
      plainText: this.getPlainText(),
      mentions: this.getMentions(),
    });
  }

  // --- Public API ---

  getValue(): string {
    return this.value;
  }

  getPlainText(): string {
    return this.value.replace(MENTION_REGEX, '$1');
  }

  getMentions(): Mention[] {
    const mentions: Mention[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(MENTION_REGEX.source, 'g');

    while ((match = regex.exec(this.value)) !== null) {
      mentions.push({
        id: match[2],
        name: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
    return mentions;
  }

  // --- Events ---

  @dispatch('mention-add', { bubbles: true, composed: true })
  private emitMentionAdd(detail?: MentionAddDetail): MentionAddDetail {
    return detail!;
  }

  @dispatch('mention-remove', { bubbles: true, composed: true })
  private emitMentionRemove(detail?: MentionRemoveDetail): MentionRemoveDetail {
    return detail!;
  }

  @dispatch('value-change', { bubbles: true, composed: true })
  private emitValueChange(detail?: ValueChangeDetail): ValueChangeDetail {
    return detail!;
  }

  // --- Private helpers ---

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(p => p.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private detectMentionChanges() {
    const currentMentions = this.getMentions();
    const currentIds = new Set(currentMentions.map(m => m.id));

    // Detect removed mentions
    for (const id of this.previousMentionIds) {
      if (!currentIds.has(id)) {
        const user = this.users.find(u => u.id === id);
        if (user) {
          this.emitMentionRemove({ user, value: this.value });
        }
      }
    }

    this.previousMentionIds = currentIds;
  }

  private getDisplayValue(): string {
    // Convert mention markers to just names for display
    return this.value.replace(MENTION_REGEX, '@$1');
  }

  private getHighlightedHtml(): string {
    // Escape HTML, then wrap mention patterns in highlight spans
    const display = this.getDisplayValue();
    const escaped = display
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight @Name patterns that correspond to actual mentions
    return escaped.replace(/@([A-Za-z][\w\s]*?)(?=\s|$|[^A-Za-z\w])/g, (match) => {
      return `<span class="mentions__highlight">${match}</span>`;
    });
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    const displayValue = target.value;

    // Convert display text back to value with mention markers
    this.syncValueFromDisplay(displayValue);

    // Check for trigger character
    this.checkForTrigger(target);
  }

  private syncValueFromDisplay(displayText: string) {
    // Simple approach: rebuild the value by preserving existing mention markers
    // where @Name matches, and using plain text everywhere else
    const currentMentions = this.getMentions();
    let result = displayText;

    // Replace @Name with @[Name](id) for known mentions
    for (const mention of currentMentions) {
      const namePattern = `@${mention.name}`;
      if (result.includes(namePattern)) {
        result = result.replace(namePattern, `@[${mention.name}](${mention.id})`);
      }
    }

    this.value = result;
  }

  private checkForTrigger(target: HTMLTextAreaElement) {
    const cursorPos = target.selectionStart;
    const textBeforeCursor = target.value.substring(0, cursorPos);

    // Find trigger character position
    const triggerIndex = textBeforeCursor.lastIndexOf(this.trigger);
    if (triggerIndex === -1) {
      this.showDropdown = false;
      return;
    }

    // Ensure trigger is at start or preceded by whitespace
    const charBefore = triggerIndex > 0 ? textBeforeCursor[triggerIndex - 1] : ' ';
    const isValid = charBefore === ' ' || charBefore === '\n' || triggerIndex === 0;

    if (!isValid) {
      this.showDropdown = false;
      return;
    }

    // Get query text between trigger and cursor
    const query = textBeforeCursor.substring(triggerIndex + this.trigger.length);

    // If query contains spaces that don't match any user name prefix, close dropdown
    if (query.includes('\n')) {
      this.showDropdown = false;
      return;
    }

    this.queryStart = triggerIndex;
    this.currentQuery = query.toLowerCase();
    this.updateFilteredUsers();
  }

  private updateFilteredUsers() {
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(this.currentQuery)
    );
    this.showDropdown = this.filteredUsers.length > 0;
    this.highlightedIndex = this.filteredUsers.length > 0 ? 0 : -1;
  }

  private selectUser(user: MentionUser) {
    if (!this.textarea) return;

    const displayValue = this.textarea.value;
    const cursorPos = this.textarea.selectionStart;

    // Replace trigger + query with mention
    const before = displayValue.substring(0, this.queryStart);
    const after = displayValue.substring(cursorPos);
    const mentionText = `@${user.name} `;
    const mentionMarker = `@[${user.name}](${user.id}) `;

    // Update display
    this.textarea.value = before + mentionText + after;

    // Update value with marker
    const valueBefore = this.value.substring(0, this.queryStart);
    const valueAfter = this.value.substring(
      this.queryStart + this.trigger.length + this.currentQuery.length
    );
    this.value = valueBefore + mentionMarker + valueAfter;

    // Set cursor after mention
    const newCursorPos = before.length + mentionText.length;
    this.textarea.setSelectionRange(newCursorPos, newCursorPos);
    this.textarea.focus();

    // Close dropdown
    this.showDropdown = false;
    this.highlightedIndex = -1;

    // Track mention and emit event
    this.previousMentionIds.add(user.id);
    this.emitMentionAdd({ user, value: this.value });
  }

  private handleKeydown(e: KeyboardEvent) {
    if (!this.showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredUsers.length - 1);
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        break;

      case 'Enter':
      case 'Tab':
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredUsers.length) {
          e.preventDefault();
          this.selectUser(this.filteredUsers[this.highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.showDropdown = false;
        this.highlightedIndex = -1;
        break;
    }
  }

  // --- Rendering ---

  private renderDropdown() {
    if (!this.showDropdown || this.filteredUsers.length === 0) return '';

    return html/*html*/`
      <div class="mentions__dropdown" part="dropdown" role="listbox">
        ${this.filteredUsers.map((user, i) => html/*html*/`
          <div class="mentions__dropdown-item ${i === this.highlightedIndex ? 'mentions__dropdown-item--highlighted' : ''}"
               role="option"
               aria-selected="${i === this.highlightedIndex}"
               @mousedown=${(e: Event) => { e.preventDefault(); this.selectUser(user); }}>
            <div class="mentions__dropdown-avatar">
              <if ${user.avatar}>
                <img src="${user.avatar}" alt="${user.name}" />
              </if>
              <if ${!user.avatar}>
                ${this.getInitials(user.name)}
              </if>
            </div>
            <span class="mentions__dropdown-name">${user.name}</span>
          </div>
        `)}
      </div>
    `;
  }

  @render()
  renderContent() {
    const displayValue = this.getDisplayValue();

    return html/*html*/`
      <div class="mentions" part="base">
        <div class="mentions__editor ${this.readonly ? 'mentions__editor--readonly' : ''}" part="editor">
          <textarea
            class="mentions__textarea"
            part="textarea"
            placeholder="${this.placeholder}"
            ?readonly=${this.readonly}
            .value=${displayValue}
            @input=${(e: Event) => this.handleInput(e)}
            @keydown=${(e: KeyboardEvent) => this.handleKeydown(e)}
            aria-autocomplete="list"
            aria-haspopup="listbox"
          ></textarea>
        </div>
        ${this.renderDropdown()}
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-mentions': SniceMentions;
  }
}
