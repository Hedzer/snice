import { element, property, render, styles, dispatch, watch, html, css } from 'snice';
import cssContent from './snice-activity-feed.css?inline';
import type { Activity, ActivityGroupBy, SniceActivityFeedElement, ActivityClickDetail, LoadMoreDetail } from './snice-activity-feed.types';

@element('snice-activity-feed')
export class SniceActivityFeed extends HTMLElement implements SniceActivityFeedElement {
  @property({ type: Array })
  activities: Activity[] = [];

  @property()
  filter = '';

  @property({ attribute: 'group-by' })
  groupBy: ActivityGroupBy = 'none';

  @watch('filter')
  handleFilterChange() {
    // Re-render on filter change
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
    try {
      const date = new Date(ts);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return ts;
    }
  }

  private getDateKey(ts: string): string {
    try {
      const date = new Date(ts);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 86400000);
      const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (itemDate.getTime() === today.getTime()) return 'Today';
      if (itemDate.getTime() === yesterday.getTime()) return 'Yesterday';
      return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  }

  private getFilteredActivities(): Activity[] {
    if (!this.filter) return this.activities;
    return this.activities.filter(a => a.type === this.filter);
  }

  private getActivityTypes(): string[] {
    const types = new Set<string>();
    for (const activity of this.activities) {
      if (activity.type) types.add(activity.type);
    }
    return Array.from(types);
  }

  private getDefaultIcon(type?: string): string {
    const icons: Record<string, string> = {
      create: '+',
      update: '~',
      delete: '-',
      comment: '\u{1F4AC}',
      deploy: '\u{1F680}',
      login: '\u{1F511}',
      upload: '\u{2B06}',
      download: '\u{2B07}',
    };
    return (type && icons[type]) || '\u{25CF}';
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
    this.emitLoadMore({ count: this.activities.length });
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

  // --- Rendering ---

  private renderFilters() {
    const types = this.getActivityTypes();
    if (types.length === 0) return '';

    return html/*html*/`
      <div class="feed__filters" part="filters">
        <button class="feed__filter ${!this.filter ? 'feed__filter--active' : ''}"
                @click=${() => this.clearFilter()}>
          All
        </button>
        ${types.map(type => html/*html*/`
          <button class="feed__filter ${this.filter === type ? 'feed__filter--active' : ''}"
                  @click=${() => this.handleFilterClick(type)}>
            ${type}
          </button>
        `)}
      </div>
    `;
  }

  private renderEntry(activity: Activity) {
    const icon = activity.icon || this.getDefaultIcon(activity.type);

    return html/*html*/`
      <div class="feed__entry"
           part="entry"
           tabindex="0"
           role="button"
           aria-label="${activity.actor.name} ${activity.action} ${activity.target || ''}"
           @click=${() => this.handleEntryClick(activity)}
           @keydown=${(e: KeyboardEvent) => this.handleEntryKeydown(e, activity)}>
        <div class="feed__icon" part="icon">${icon}</div>
        <div class="feed__content" part="content">
          <div class="feed__description">
            <span class="feed__actor">
              <if ${activity.actor.avatar}>
                <span class="feed__actor-avatar">
                  <img src="${activity.actor.avatar}" alt="${activity.actor.name}" />
                </span>
              </if>
              <if ${!activity.actor.avatar}>
                <span class="feed__actor-avatar">${this.getInitials(activity.actor.name)}</span>
              </if>
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

  private renderGrouped(filtered: Activity[]) {
    const groups = new Map<string, Activity[]>();

    for (const activity of filtered) {
      const key = this.getDateKey(activity.timestamp);
      const existing = groups.get(key) || [];
      existing.push(activity);
      groups.set(key, existing);
    }

    const result: unknown[] = [];
    for (const [key, groupActivities] of groups) {
      result.push(html/*html*/`
        <div class="feed__group-header" part="group-header">${key}</div>
      `);
      for (const activity of groupActivities) {
        result.push(this.renderEntry(activity));
      }
    }

    return result;
  }

  @render()
  renderContent() {
    const filtered = this.getFilteredActivities();
    const hasActivities = filtered.length > 0;
    const hasTypes = this.getActivityTypes().length > 0;
    const isGrouped = this.groupBy === 'date';

    return html/*html*/`
      <div class="feed" part="base">
        <if ${hasTypes}>
          ${this.renderFilters()}
        </if>

        <if ${hasActivities}>
          <div class="feed__list" part="list">
            <if ${isGrouped}>
              ${this.renderGrouped(filtered)}
            </if>
            <if ${!isGrouped}>
              ${filtered.map(a => this.renderEntry(a))}
            </if>
          </div>
          <div class="feed__load-more">
            <button class="feed__load-more-btn"
                    @click=${() => this.handleLoadMore()}>
              Load more
            </button>
          </div>
        </if>

        <if ${!hasActivities}>
          <div class="feed__empty">No activity to display.</div>
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
