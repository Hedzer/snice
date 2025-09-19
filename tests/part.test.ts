import { beforeEach, describe, it, expect } from 'vitest';
import { element, part, property, watch } from './test-imports';
import type { SniceElement } from './test-imports';

describe('@part decorator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should render parts on initial connection', async () => {
    @element('test-part-basic-2024')
    class TestPartsBasic extends HTMLElement {
      user = {
        name: 'John Doe',
        bio: 'Software developer'
      };

      html() {
        return `
          <section>
            <h1 part="title"></h1>
            <div part="bio"></div>
          </section>
        `;
      }

      @part('title')
      renderTitle() {
        return `<span>${this.user.name}</span>`;
      }

      @part('bio')
      renderBio() {
        return `<p>${this.user.bio}</p>`;
      }
    }

    const el = document.createElement('test-part-basic-2024') as TestPartsBasic & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    // Check that parts were rendered
    const titleElement = el.shadowRoot!.querySelector('[part="title"]');
    const bioElement = el.shadowRoot!.querySelector('[part="bio"]');

    expect(titleElement!.innerHTML).toBe('<span>John Doe</span>');
    expect(bioElement!.innerHTML).toBe('<p>Software developer</p>');
  });

  it('should support async part methods', async () => {
    @element('test-parts-async-unique')
    class TestPartsAsync extends HTMLElement {
      data = 'async content';

      html() {
        return `<div part="content"></div>`;
      }

      @part('content')
      async renderContent() {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return `<span>${this.data}</span>`;
      }
    }

    const el = document.createElement('test-parts-async-unique') as TestPartsAsync & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    const contentElement = el.shadowRoot!.querySelector('[part="content"]');
    expect(contentElement!.innerHTML).toBe('<span>async content</span>');
  });

  it('should re-render individual parts with renderPart method', async () => {
    @element('test-parts-rerender-unique')
    class TestPartsRerender extends HTMLElement {
      count = 0;

      html() {
        return `
          <div>
            <span part="counter"></span>
            <button id="increment">Increment</button>
          </div>
        `;
      }

      @part('counter')
      renderCounter() {
        return `Count: ${this.count}`;
      }

      increment() {
        this.count++;
        this.renderCounter(); // Call the @part decorated method directly
      }
    }

    const el = document.createElement('test-parts-rerender-unique') as TestPartsRerender & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    const counterElement = el.shadowRoot!.querySelector('[part="counter"]');
    expect(counterElement!.innerHTML).toBe('Count: 0');

    // Update and re-render
    el.increment();
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for re-render

    expect(counterElement!.innerHTML).toBe('Count: 1');
  });

  it('should handle missing part elements gracefully', async () => {
    @element('test-parts-missing-unique')
    class TestPartsMissing extends HTMLElement {
      html() {
        return `<div>No parts here</div>`;
      }

      @part('missing')
      renderMissing() {
        return 'This should not render';
      }
    }

    const el = document.createElement('test-parts-missing-unique') as TestPartsMissing & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    // This test just verifies the element connects properly
    // Missing parts are handled gracefully during initial render
  });

  it('should handle multiple parts', async () => {
    @element('test-parts-multiple-unique')
    class TestPartsMultiple extends HTMLElement {
      items = ['Item 1', 'Item 2', 'Item 3'];

      html() {
        return `
          <div>
            <h2 part="header"></h2>
            <ul part="list"></ul>
            <footer part="footer"></footer>
          </div>
        `;
      }

      @part('header')
      renderHeader() {
        return `Items (${this.items.length})`;
      }

      @part('list')
      renderList() {
        return this.items.map(item => `<li>${item}</li>`).join('');
      }

      @part('footer')
      renderFooter() {
        return `Total: ${this.items.length} items`;
      }
    }

    const el = document.createElement('test-parts-multiple-unique') as TestPartsMultiple & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    const headerElement = el.shadowRoot!.querySelector('[part="header"]');
    const listElement = el.shadowRoot!.querySelector('[part="list"]');
    const footerElement = el.shadowRoot!.querySelector('[part="footer"]');

    expect(headerElement!.innerHTML).toBe('Items (3)');
    expect(listElement!.innerHTML).toBe('<li>Item 1</li><li>Item 2</li><li>Item 3</li>');
    expect(footerElement!.innerHTML).toBe('Total: 3 items');
  });

  it('should handle part methods that return undefined', async () => {
    @element('test-parts-undefined-unique')
    class TestPartsUndefined extends HTMLElement {
      showContent = false;

      html() {
        return `<div part="conditional"></div>`;
      }

      @part('conditional')
      renderConditional() {
        return this.showContent ? 'Content shown' : undefined;
      }
    }

    const el = document.createElement('test-parts-undefined-unique') as TestPartsUndefined & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    const conditionalElement = el.shadowRoot!.querySelector('[part="conditional"]');
    expect(conditionalElement!.innerHTML).toBe(''); // Should remain empty

    // Now show content and call the part method to re-render
    el.showContent = true;
    await el.renderConditional(); // Call the @part decorated method directly
    
    expect(conditionalElement!.innerHTML).toBe('Content shown');
  });

  it('should support throttle option to limit render frequency', async () => {
    let renderCount = 0;
    
    @element('test-parts-throttle-unique')
    class TestPartsThrottle extends HTMLElement {
      count = 0;

      html() {
        return `<div part="counter"></div>`;
      }

      @part('counter', { throttle: 100 })
      renderCounter() {
        renderCount++;
        return `Count: ${this.count} (renders: ${renderCount})`;
      }

      increment() {
        this.count++;
        this.renderCounter();
      }
    }

    const el = document.createElement('test-parts-throttle-unique') as TestPartsThrottle & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    const counterElement = el.shadowRoot!.querySelector('[part="counter"]');
    
    // Initial render during connection
    expect(counterElement!.innerHTML).toContain('Count: 0');
    const initialRenderCount = renderCount;

    // Reset the timer to start fresh for throttling test
    await new Promise(resolve => setTimeout(resolve, 10));

    // Rapid calls - should be throttled
    el.increment(); // Should render immediately (first call after throttle period)
    el.increment(); // Should be throttled
    el.increment(); // Should be throttled
    
    // Should only have 1 additional render beyond initial
    expect(renderCount).toBe(initialRenderCount + 1);
    
    // Wait for throttle period to pass
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should have caught up with one more render from the scheduled throttle
    expect(renderCount).toBe(initialRenderCount + 2);
  });

  it('should support debounce option to delay renders', async () => {
    let renderCount = 0;
    
    @element('test-parts-debounce-unique')
    class TestPartsDebounce extends HTMLElement {
      text = '';

      html() {
        return `<div part="content"></div>`;
      }

      @part('content', { debounce: 50 })
      renderContent() {
        renderCount++;
        return `Text: ${this.text} (renders: ${renderCount})`;
      }

      updateText(newText: string) {
        this.text = newText;
        this.renderContent();
      }
    }

    const el = document.createElement('test-parts-debounce-unique') as TestPartsDebounce & SniceElement;
    document.body.appendChild(el);
    await el.ready;
    
    // Initial render
    expect(renderCount).toBe(1);

    // Rapid updates - should be debounced
    el.updateText('a');
    el.updateText('ab'); 
    el.updateText('abc');
    
    // No additional renders yet due to debouncing
    expect(renderCount).toBe(1);
    
    // Wait for debounce period
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have rendered once after debounce period
    expect(renderCount).toBe(2);
    
    const contentElement = el.shadowRoot!.querySelector('[part="content"]');
    expect(contentElement!.innerHTML).toContain('Text: abc');
  });

  it('should handle conflicting throttle and debounce options (debounce takes precedence)', async () => {
    let renderCount = 0;
    
    @element('test-parts-throttle-debounce-unique')
    class TestPartsThrottleDebounce extends HTMLElement {
      text = '';

      html() {
        return `<div part="content"></div>`;
      }

      @part('content', { throttle: 100, debounce: 50 })
      renderContent() {
        renderCount++;
        return `Text: ${this.text} (renders: ${renderCount})`;
      }

      updateText(newText: string) {
        this.text = newText;
        this.renderContent();
      }
    }

    const el = document.createElement('test-parts-throttle-debounce-unique') as TestPartsThrottleDebounce & SniceElement;
    document.body.appendChild(el);
    await el.ready;
    
    // Initial render
    expect(renderCount).toBe(1);

    // Rapid updates - debounce should take precedence over throttle
    el.updateText('a');
    el.updateText('ab'); 
    el.updateText('abc');
    
    // No additional renders yet due to debouncing (throttle is ignored)
    expect(renderCount).toBe(1);
    
    // Wait for debounce period (debounce wins over throttle)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have rendered once after debounce period
    expect(renderCount).toBe(2);
    
    const contentElement = el.shadowRoot!.querySelector('[part="content"]');
    expect(contentElement!.innerHTML).toContain('Text: abc');
  });

  it('should handle zero/negative values gracefully', async () => {
    let renderCount = 0;
    
    @element('test-parts-invalid-options-unique')
    class TestPartsInvalidOptions extends HTMLElement {
      text = '';

      html() {
        return `<div part="content"></div>`;
      }

      @part('content', { throttle: 0, debounce: -10 })
      renderContent() {
        renderCount++;
        return `Text: ${this.text} (renders: ${renderCount})`;
      }

      updateText(newText: string) {
        this.text = newText;
        this.renderContent();
      }
    }

    const el = document.createElement('test-parts-invalid-options-unique') as TestPartsInvalidOptions & SniceElement;
    document.body.appendChild(el);
    await el.ready;
    
    // Initial render
    expect(renderCount).toBe(1);

    // Should render immediately since invalid debounce value
    el.updateText('test');
    expect(renderCount).toBe(2);
    
    const contentElement = el.shadowRoot!.querySelector('[part="content"]');
    expect(contentElement!.innerHTML).toContain('Text: test');
  });

  it('should work with @watch for semi-reactive rendering', async () => {
    let userPartRenderCount = 0;
    let statsPartRenderCount = 0;
    
    @element('test-part-watch-unique')
    class TestPartWatch extends HTMLElement {
      @property()
      userName = 'Initial User';
      
      @property({ type: Number })
      userScore = 0;
      
      @property()
      theme = 'light';

      html() {
        return `
          <div part="user-info"></div>
          <div part="stats"></div>
          <div part="theme"></div>
        `;
      }

      @part('user-info')
      renderUserInfo() {
        userPartRenderCount++;
        return `<h1>${this.userName}</h1>`;
      }

      @part('stats', { throttle: 50 })
      renderStats() {
        statsPartRenderCount++;
        return `<div>Score: ${this.userScore}</div>`;
      }

      @part('theme')
      renderTheme() {
        return `<div class="${this.theme}">Theme: ${this.theme}</div>`;
      }

      // Watch for userName changes and automatically re-render user-info part
      @watch('userName')
      onUserNameChange() {
        this.renderUserInfo();
      }

      // Watch for userScore changes and automatically re-render stats part (throttled)
      @watch('userScore')
      onUserScoreChange() {
        this.renderStats();
      }

      // Watch for theme changes and automatically re-render theme part
      @watch('theme')
      onThemeChange() {
        this.renderTheme();
      }
    }

    const el = document.createElement('test-part-watch-unique') as TestPartWatch & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initial renders (both from connection AND @watch triggers during property initialization)
    const initialUserRenderCount = userPartRenderCount;
    const initialStatsRenderCount = statsPartRenderCount;

    const userInfoElement = el.shadowRoot!.querySelector('[part="user-info"]');
    const statsElement = el.shadowRoot!.querySelector('[part="stats"]');
    const themeElement = el.shadowRoot!.querySelector('[part="theme"]');

    expect(userInfoElement!.innerHTML).toBe('<h1>Initial User</h1>');
    expect(statsElement!.innerHTML).toBe('<div>Score: 0</div>');

    // Change userName - should trigger watch which calls renderUserInfo
    el.userName = 'Updated User';
    expect(userPartRenderCount).toBe(initialUserRenderCount + 1);
    expect(userInfoElement!.innerHTML).toBe('<h1>Updated User</h1>');

    // Change userScore multiple times rapidly - should be throttled
    el.userScore = 10;
    el.userScore = 20;
    el.userScore = 30;
    
    // Throttle may have prevented additional renders if they happened too quickly
    // The key is that we don't get 3 additional renders (one for each property change)
    // With new decorators, we might get 1 render due to slightly different timing
    const immediateRenderCount = statsPartRenderCount - initialStatsRenderCount;
    expect(immediateRenderCount).toBeLessThanOrEqual(1);

    // DOM might show intermediate value due to throttling (first change gets through)
    const currentScore = statsElement!.innerHTML;
    // Throttling allows first change through but blocks subsequent rapid changes
    expect(currentScore).toMatch(/^<div>Score: (0|10|20|30)<\/div>$/);

    // Wait for throttle period
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have caught up with final render (immediate + throttled render)
    expect(statsPartRenderCount).toBe(initialStatsRenderCount + 2);
    expect(statsElement!.innerHTML).toBe('<div>Score: 30</div>');

    // Change theme - should trigger immediate re-render
    el.theme = 'dark';
    expect(themeElement!.innerHTML).toBe('<div class="dark">Theme: dark</div>');
  });

  it('should handle nested parts correctly', async () => {
    let outerRenderCount = 0;
    let innerRenderCount = 0;
    let detailRenderCount = 0;
    
    @element('test-nested-parts-unique')
    class TestNestedParts extends HTMLElement {
      @property()
      userStatus = 'online';
      
      @property()
      userName = 'John';
      
      @property({ type: Number })
      messageCount = 5;

      html() {
        return `
          <div class="container">
            <section part="user-card"></section>
            <footer part="status-bar">Static footer content</footer>
          </div>
        `;
      }

      @part('user-card')
      renderUserCard() {
        outerRenderCount++;
        return `
          <div class="card">
            <header part="user-header"></header>
            <main part="user-details"></main>
          </div>
        `;
      }

      @part('user-header')
      renderUserHeader() {
        innerRenderCount++;
        return `<h2>User: ${this.userName} (${this.userStatus})</h2>`;
      }

      @part('user-details')
      renderUserDetails() {
        detailRenderCount++;
        return `
          <div class="details">
            <p>Messages: ${this.messageCount}</p>
            <span part="nested-badge"></span>
          </div>
        `;
      }

      @part('nested-badge')
      renderNestedBadge() {
        return `<span class="badge">${this.messageCount > 10 ? 'Active' : 'Quiet'}</span>`;
      }

      // Method to update specific nested parts
      updateUserInfo() {
        this.renderUserHeader();
      }

      updateDetails() {
        this.renderUserDetails();
      }

      updateFullCard() {
        this.renderUserCard();
      }
    }

    const el = document.createElement('test-nested-parts-unique') as TestNestedParts & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Check that nested structure was created
    const userCardElement = el.shadowRoot!.querySelector('[part="user-card"]');
    const userHeaderElement = el.shadowRoot!.querySelector('[part="user-header"]');
    const userDetailsElement = el.shadowRoot!.querySelector('[part="user-details"]');
    const nestedBadgeElement = el.shadowRoot!.querySelector('[part="nested-badge"]');

    expect(userCardElement).toBeTruthy();
    expect(userHeaderElement).toBeTruthy();
    expect(userDetailsElement).toBeTruthy();
    expect(nestedBadgeElement).toBeTruthy();

    // Verify initial content
    expect(userHeaderElement!.innerHTML).toBe('<h2>User: John (online)</h2>');
    expect(userDetailsElement!.innerHTML).toContain('Messages: 5');
    expect(nestedBadgeElement!.innerHTML).toBe('<span class="badge">Quiet</span>');

    // Test individual part updates
    const initialOuterCount = outerRenderCount;
    const initialInnerCount = innerRenderCount;
    const initialDetailCount = detailRenderCount;

    // Update just the header part
    el.userName = 'Jane';
    el.updateUserInfo();
    
    expect(innerRenderCount).toBe(initialInnerCount + 1);
    expect(outerRenderCount).toBe(initialOuterCount); // Outer part should NOT re-render
    expect(userHeaderElement!.innerHTML).toBe('<h2>User: Jane (online)</h2>');

    // Update details part
    el.messageCount = 15;
    el.updateDetails();
    
    expect(detailRenderCount).toBe(initialDetailCount + 1);
    expect(userDetailsElement!.innerHTML).toContain('Messages: 15');
    
    // IMPORTANT: Nested parts inside @part methods need explicit re-rendering!
    // The nested-badge part was recreated in the DOM but with empty content
    // because @part methods only render their immediate content, not nested parts
    await el.renderNestedBadge(); // Must explicitly call to update nested content
    
    const updatedNestedBadgeElement = el.shadowRoot!.querySelector('[part="nested-badge"]');
    expect(updatedNestedBadgeElement!.innerHTML).toBe('<span class="badge">Active</span>');

    // Test full card re-render - this should recreate the entire nested structure
    const beforeFullRender = outerRenderCount;
    el.updateFullCard();
    
    expect(outerRenderCount).toBe(beforeFullRender + 1);
    
    // After full card re-render, nested parts should still exist and work
    const newUserHeaderElement = el.shadowRoot!.querySelector('[part="user-header"]');
    const newUserDetailsElement = el.shadowRoot!.querySelector('[part="user-details"]');
    
    expect(newUserHeaderElement).toBeTruthy();
    expect(newUserDetailsElement).toBeTruthy();
    
    // But they might not have the updated content since we only re-rendered the outer part
    // The inner parts need to be explicitly re-rendered after the outer part changes
  });

  it('should handle deeply nested parts with independent updates', async () => {
    @element('test-deep-nested-parts-unique')
    class TestDeepNestedParts extends HTMLElement {
      @property()
      level1Data = 'Level 1';
      
      @property()
      level2Data = 'Level 2';
      
      @property()
      level3Data = 'Level 3';

      html() {
        return `
          <div part="level1"></div>
        `;
      }

      @part('level1')
      renderLevel1() {
        return `
          <div class="level1">
            <h1>${this.level1Data}</h1>
            <div part="level2"></div>
          </div>
        `;
      }

      @part('level2')
      renderLevel2() {
        return `
          <div class="level2">
            <h2>${this.level2Data}</h2>
            <div part="level3"></div>
          </div>
        `;
      }

      @part('level3')
      renderLevel3() {
        return `
          <div class="level3">
            <h3>${this.level3Data}</h3>
          </div>
        `;
      }

      @watch('level1Data')
      onLevel1Change() {
        this.renderLevel1();
      }

      @watch('level2Data')
      onLevel2Change() {
        this.renderLevel2();
      }

      @watch('level3Data')
      onLevel3Change() {
        this.renderLevel3();
      }
    }

    const el = document.createElement('test-deep-nested-parts-unique') as TestDeepNestedParts & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Verify initial nested structure
    const level1Element = el.shadowRoot!.querySelector('[part="level1"]');
    const level2Element = el.shadowRoot!.querySelector('[part="level2"]');
    const level3Element = el.shadowRoot!.querySelector('[part="level3"]');

    expect(level1Element).toBeTruthy();
    expect(level2Element).toBeTruthy();
    expect(level3Element).toBeTruthy();

    expect(level1Element!.innerHTML).toContain('Level 1');
    expect(level2Element!.innerHTML).toContain('Level 2');
    expect(level3Element!.innerHTML).toContain('Level 3');

    // Test that updating level 3 doesn't affect level 1 or 2
    el.level3Data = 'Updated Level 3';
    expect(level3Element!.innerHTML).toContain('Updated Level 3');
    expect(level2Element!.innerHTML).toContain('Level 2'); // Should be unchanged
    expect(level1Element!.innerHTML).toContain('Level 1'); // Should be unchanged

    // Test that updating level 1 recreates the structure but level 2 and 3 need manual updates
    el.level1Data = 'Updated Level 1';
    
    // Level 1 should be updated
    expect(level1Element!.innerHTML).toContain('Updated Level 1');
    
    // But level 2 and 3 parts need to be re-rendered manually after level 1 changes the structure
    await el.renderLevel2();
    await el.renderLevel3();
    
    const newLevel2Element = el.shadowRoot!.querySelector('[part="level2"]');
    const newLevel3Element = el.shadowRoot!.querySelector('[part="level3"]');
    
    expect(newLevel2Element!.innerHTML).toContain('Level 2');
    expect(newLevel3Element!.innerHTML).toContain('Updated Level 3');
  });

  it('should demonstrate the key behavior of nested parts', async () => {
    @element('test-nested-behavior-unique')
    class TestNestedBehavior extends HTMLElement {
      @property()
      outerValue = 'Outer';
      
      @property()
      innerValue = 'Inner';

      html() {
        return `
          <div part="outer-container"></div>
        `;
      }

      @part('outer-container')
      renderOuterContainer() {
        return `
          <div class="outer">
            <h1>${this.outerValue}</h1>
            <div part="inner-content"></div>
          </div>
        `;
      }

      @part('inner-content')
      renderInnerContent() {
        return `<p>${this.innerValue}</p>`;
      }
    }

    const el = document.createElement('test-nested-behavior-unique') as TestNestedBehavior & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initially, both parts should be rendered
    const outerElement = el.shadowRoot!.querySelector('[part="outer-container"]');
    const innerElement = el.shadowRoot!.querySelector('[part="inner-content"]');
    
    expect(outerElement!.innerHTML).toContain('Outer');
    expect(innerElement!.innerHTML).toBe('<p>Inner</p>');

    // KEY FINDING 1: Updating a nested part works independently
    el.innerValue = 'Updated Inner';
    await el.renderInnerContent();
    
    const stillInnerElement = el.shadowRoot!.querySelector('[part="inner-content"]');
    expect(stillInnerElement!.innerHTML).toBe('<p>Updated Inner</p>');
    expect(outerElement!.innerHTML).toContain('Outer'); // Outer unchanged

    // KEY FINDING 2: When outer part re-renders, inner part gets new DOM but no content
    el.outerValue = 'Updated Outer';
    await el.renderOuterContainer();
    
    const newOuterElement = el.shadowRoot!.querySelector('[part="outer-container"]');
    const newInnerElement = el.shadowRoot!.querySelector('[part="inner-content"]');
    
    expect(newOuterElement!.innerHTML).toContain('Updated Outer');
    expect(newInnerElement).toBeTruthy(); // Element exists (part attribute in HTML)
    expect(newInnerElement!.innerHTML).toBe(''); // But content is EMPTY!

    // KEY FINDING 3: After outer re-render, nested parts need explicit re-rendering
    await el.renderInnerContent();
    
    const finalInnerElement = el.shadowRoot!.querySelector('[part="inner-content"]');
    expect(finalInnerElement!.innerHTML).toBe('<p>Updated Inner</p>'); // Now has content
  });

  it('should demonstrate best practices for nested parts coordination', async () => {
    @element('test-nested-coordination-unique')
    class TestNestedCoordination extends HTMLElement {
      @property({ type: Object })
      userInfo = { name: 'John', role: 'User' };
      
      @property({ type: Number })
      points = 100;

      html() {
        return `
          <div part="user-card"></div>
        `;
      }

      @part('user-card')
      renderUserCard() {
        return `
          <div class="card">
            <div part="user-header"></div>
            <div part="user-stats"></div>
          </div>
        `;
      }

      @part('user-header')
      renderUserHeader() {
        return `<h2>${this.userInfo.name} (${this.userInfo.role})</h2>`;
      }

      @part('user-stats')
      renderUserStats() {
        return `<div class="stats">Points: ${this.points}</div>`;
      }

      // BEST PRACTICE: Coordination method that updates related parts together
      async updateFullCard() {
        await this.renderUserCard();
        // After outer re-render, refresh all nested parts
        await this.renderUserHeader();
        await this.renderUserStats();
      }

      // BEST PRACTICE: Targeted updates for specific changes
      async updateUserInfo(name: string, role: string) {
        this.userInfo = { name, role };
        await this.renderUserHeader(); // Only update what changed
      }

      async updatePoints(newPoints: number) {
        this.points = newPoints;
        await this.renderUserStats(); // Only update what changed
      }
    }

    const el = document.createElement('test-nested-coordination-unique') as TestNestedCoordination & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Test targeted updates
    await el.updateUserInfo('Jane', 'Admin');
    
    const headerElement = el.shadowRoot!.querySelector('[part="user-header"]');
    const statsElement = el.shadowRoot!.querySelector('[part="user-stats"]');
    
    expect(headerElement!.innerHTML).toBe('<h2>Jane (Admin)</h2>');
    expect(statsElement!.innerHTML).toBe('<div class="stats">Points: 100</div>'); // Unchanged

    await el.updatePoints(250);
    expect(statsElement!.innerHTML).toBe('<div class="stats">Points: 250</div>');

    // Test coordinated full update
    el.userInfo = { name: 'Bob', role: 'SuperAdmin' };
    el.points = 500;
    await el.updateFullCard();
    
    const newHeaderElement = el.shadowRoot!.querySelector('[part="user-header"]');
    const newStatsElement = el.shadowRoot!.querySelector('[part="user-stats"]');
    
    expect(newHeaderElement!.innerHTML).toBe('<h2>Bob (SuperAdmin)</h2>');
    expect(newStatsElement!.innerHTML).toBe('<div class="stats">Points: 500</div>');
  });
});