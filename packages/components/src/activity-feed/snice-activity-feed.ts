import { element, property, state, render, styles, dispatch, watch, ready, dispose, observe, repeat, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-activity-feed.css?inline';
import './snice-activity-item';
import type { Activity, ActivityGroupBy, SniceActivityFeedElement, SniceActivityItemElement, ActivityClickDetail, LoadMoreDetail } from './snice-activity-feed.types';

const DEFAULT_TYPE_ICONS: Record<string, string> = {
  create: 'plus',
  update: 'pencil',
  delete: 'trash',
  comment: 'chat-bubble',
  deploy: 'rocket-launch',
  login: 'key',
  upload: 'arrow-up-tray',
  download: 'arrow-down-tray',
};

const FALLBACK_ICON = 'circle';

@element('snice-activity-feed')
export class SniceActivityFeed extends HTMLElement implements SniceActivityFeedElement {
  @property({ type: Array, attribute: false })
  activities: Activity[] = [];

  @property()
  filter = '';

  @property({ attribute: 'group-by' })
  groupBy: ActivityGroupBy = 'none';

  @property({ type: Boolean, attribute: 'has-more' })
  hasMore = false;

  @property({ type: Number, attribute: 'refresh-interval' })
  refreshInterval = 60000;

  @property({ attribute: 'empty-message' })
  emptyMessage = 'No activity to display.';

  @property({ attribute: 'load-more-label' })
  loadMoreLabel = 'Load more';

  @property({ attribute: 'all-label' })
  allLabel = 'All';

  // Activities sourced from slotted snice-activity-item children. When any
  // exist they take precedence over the `activities` array (slot wins).
  @state()
  private declarativeActivities: Activity[] = [];

  // Avatar URLs that failed to load; entries fall back to initials.
  @state()
  private failedAvatars: ReadonlySet<string> = new Set();

  // Bumped by the refresh timer so relative timestamps re-render.
  @state()
  private timestampTick = 0;

  private tickTimer: ReturnType<typeof setInterval> | null = null;

  @ready()
  init() {
    this.syncDeclarativeItems();
    this.startTicking();
  }

  @dispose()
  cleanup() {
    this.stopTicking();
  }

  @watch('refreshInterval')
  handleRefreshIntervalChange() {
    this.startTicking();
  }

  @observe('mutation:childList', { subtree: true, throttle: 50 })
  onChildListChange() {
    this.syncDeclarativeItems();
  }

  @observe('mutation:attributes', { subtree: true, throttle: 50 })
  onChildAttributeChange() {
    this.syncDeclarativeItems();
  }

  private startTicking() {
    this.stopTicking();
    if (this.refreshInterval > 0) {
      this.tickTimer = setInterval(() => {
        this.timestampTick++;
      }, this.refreshInterval);
    }
  }

  private stopTicking() {
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private syncDeclarativeItems() {
    const items = Array.from(this.querySelectorAll('snice-activity-item')) as SniceActivityItemElement[];
    this.declarativeActivities = items.map((item, index) => ({
      id: item.itemId || item.getAttribute('item-id') || `activity-item-${index}`,
      actor: {
        name: item.actorName || item.getAttribute('actor-name') || '',
        avatar: item.actorAvatar || item.getAttribute('actor-avatar') || undefined,
      },
      action: item.action || item.getAttribute('action') || '',
      target: item.target || item.getAttribute('target') || undefined,
      timestamp: item.timestamp || item.getAttribute('timestamp') || '',
      icon: item.icon || item.getAttribute('icon') || undefined,
      type: item.type || item.getAttribute('type') || undefined,
    }));
  }

  private getSourceActivities(): Activity[] {
    return this.declarativeActivities.length > 0 ? this.declarativeActivities : this.activities;
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private formatTimestamp(ts: string): string {
    const date = new Date(ts);
    const time = date.getTime();
    if (Number.isNaN(time)) return ts;

    const diff = Date.now() - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  private getDateKey(ts: string): string {
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return ts;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (itemDate.getTime() === today.getTime()) return 'Today';
    if (itemDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  private getFilteredActivities(): Activity[] {
    const source = this.getSourceActivities();
    if (!this.filter) return source;
    return source.filter(a => a.type === this.filter);
  }

  private getActivityTypes(): string[] {
    const types = new Set<string>();
    for (const activity of this.getSourceActivities()) {
      if (activity.type) types.add(activity.type);
    }
    return Array.from(types);
  }

  private getIconName(activity: Activity): string {
    if (activity.icon) return activity.icon;
    return (activity.type && DEFAULT_TYPE_ICONS[activity.type]) || FALLBACK_ICON;
  }

  // --- Public API ---

  addActivity(activity: Activity): void {
    this.activities = [activity, ...this.activities];
  }

  clearFilter(): void {
    this.filter = '';
  }

  // --- Events ---

  @dispatch('activity-click', { bubbles: true, composed: true })
  private emitActivityClick(detail?: ActivityClickDetail): ActivityClickDetail {
    return detail!;
  }

  @dispatch('load-more', { bubbles: true, composed: true })
  private emitLoadMore(detail?: LoadMoreDetail): LoadMoreDetail {
    return detail!;
  }

  private handleEntryClick(activity: Activity) {
    this.emitActivityClick({ activity });
  }

  private handleLoadMore() {
    this.emitLoadMore({ count: this.getSourceActivities().length });
  }

  private handleFilterClick(type: string) {
    this.filter = this.filter === type ? '' : type;
  }

  private handleEntryKeydown(e: KeyboardEvent, activity: Activity) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleEntryClick(activity);
    }
  }

  private handleAvatarError(url: string) {
    this.failedAvatars = new Set([...this.failedAvatars, url]);
  }

  // --- Rendering ---

  private renderFilters() {
    const types = this.getActivityTypes();
    if (types.length === 0) return '';

    return html/*html*/`
      <div class="feed__filters" part="filters">
        <button class="feed__filter ${!this.filter ? 'feed__filter--active' : ''}"
                aria-pressed="${!this.filter}"
                @click=${() => this.clearFilter()}>
          ${this.allLabel}
        </button>
        ${types.map(type => html/*html*/`
          <button class="feed__filter ${this.filter === type ? 'feed__filter--active' : ''}"
                  aria-pressed="${this.filter === type}"
                  @click=${() => this.handleFilterClick(type)}>
            ${type}
          </button>
        `)}
      </div>
    `;
  }

  private renderAvatar(activity: Activity) {
    const avatar = activity.actor.avatar;
    const showImage = avatar && !this.failedAvatars.has(avatar);

    return html/*html*/`
      <span class="feed__actor-avatar">
        <if ${showImage}>
          <img src="${avatar}" alt="${activity.actor.name}" loading="lazy"
               @error=${() => this.handleAvatarError(avatar!)} />
        </if>
        <if ${!showImage}>
          ${this.getInitials(activity.actor.name)}
        </if>
      </span>
    `;
  }

  private renderEntry(activity: Activity, posinset: number, setsize: number) {
    return html/*html*/`
      <div class="feed__entry"
           part="entry"
           tabindex="0"
           role="article"
           aria-posinset="${posinset}"
           aria-setsize="${setsize}"
           aria-label="${activity.actor.name} ${activity.action} ${activity.target || ''}"
           @click=${() => this.handleEntryClick(activity)}
           @keydown=${(e: KeyboardEvent) => this.handleEntryKeydown(e, activity)}>
        <div class="feed__icon" part="icon">${renderIcon(this.getIconName(activity), 'feed__icon-glyph')}</div>
        <div class="feed__content" part="content">
          <div class="feed__description">
            <span class="feed__actor">
              ${this.renderAvatar(activity)}
              ${activity.actor.name}
            </span>
            <span class="feed__action"> ${activity.action} </span>
            <if ${activity.target}>
              <span class="feed__target">${activity.target}</span>
            </if>
            <if ${activity.type}>
              <span class="feed__type-badge">${activity.type}</span>
            </if>
          </div>
          <div class="feed__timestamp" part="timestamp">${this.formatTimestamp(activity.timestamp)}</div>
        </div>
      </div>
    `;
  }

  private renderList(filtered: Activity[]) {
    const setsize = filtered.length;
    let position = 0;

    return repeat(filtered, {
      key: activity => activity.id,
      render: activity => this.renderEntry(activity, ++position, setsize),
    });
  }

  private renderGrouped(filtered: Activity[]) {
    // Grouping implies chronology: newest activities (and groups) first.
    // Unparseable timestamps sink to the end and group under their raw text.
    const sorted = [...filtered].sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return (Number.isNaN(tb) ? -Infinity : tb) - (Number.isNaN(ta) ? -Infinity : ta);
    });

    const groups = new Map<string, Activity[]>();
    for (const activity of sorted) {
      const key = this.getDateKey(activity.timestamp);
      const existing = groups.get(key) || [];
      existing.push(activity);
      groups.set(key, existing);
    }

    const setsize = sorted.length;
    let position = 0;

    const result: unknown[] = [];
    for (const [key, groupActivities] of groups) {
      result.push(html/*html*/`
        <div class="feed__group-header" part="group-header">${key}</div>
      `);
      result.push(repeat(groupActivities, {
        key: activity => activity.id,
        render: activity => this.renderEntry(activity, ++position, setsize),
      }));
    }

    return result;
  }

  @render()
  renderContent() {
    const filtered = this.getFilteredActivities();
    const hasActivities = filtered.length > 0;
    const hasTypes = this.getActivityTypes().length > 0;
    const isGrouped = this.groupBy === 'date';
    const showLoadMore = hasActivities && this.hasMore;

    return html/*html*/`
      <div class="feed" part="base">
        <slot class="feed__data-slot"></slot>

        <if ${hasTypes}>
          ${this.renderFilters()}
        </if>

        <if ${hasActivities}>
          <div class="feed__list" part="list" role="feed">
            <if ${isGrouped}>
              ${this.renderGrouped(filtered)}
            </if>
            <if ${!isGrouped}>
              ${this.renderList(filtered)}
            </if>
          </div>
        </if>

        <if ${showLoadMore}>
          <div class="feed__load-more">
            <button class="feed__load-more-btn"
                    @click=${() => this.handleLoadMore()}>
              ${this.loadMoreLabel}
            </button>
          </div>
        </if>

        <if ${!hasActivities}>
          <div class="feed__empty">${this.emptyMessage}</div>
        </if>
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
    'snice-activity-feed': SniceActivityFeed;
  }
}
