import { expect, test, type Page } from '@playwright/test';

async function exerciseUntrustedFileGalleryData(
  page: Page,
  build: 'source' | 'distribution' | 'cdn'
) {
  await page.goto('/guide.html');
  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/file-gallery/snice-file-gallery.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/file-gallery/snice-file-gallery.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-file-gallery.min.js' });
  }
  await page.waitForFunction(() => !!customElements.get('snice-file-gallery'));

  return page.evaluate(async (targetBuild) => {
    const runtime = targetBuild === 'source'
      ? await import('/packages/core/src/index.ts')
      : targetBuild === 'distribution'
        ? await import('/dist/index.esm.js')
        : (globalThis as any).Snice;
    const { unsafeHTML } = runtime;

    const fileName = '<img data-gallery-injected="filename" src="missing-name.png" onerror="globalThis.__sniceGalleryInjected++"><svg><script>globalThis.__sniceGalleryInjected++</script></svg>.png';
    const mimeType = 'image/png"><img data-gallery-injected="mime" src="missing-mime.png" onerror="globalThis.__sniceGalleryInjected++">';
    const preview = 'missing-preview.png" onerror="globalThis.__sniceGalleryInjected++" data-gallery-injected="preview';
    const badge = '<img data-gallery-injected="badge" src="missing-badge.png" onerror="globalThis.__sniceGalleryInjected++"><b>New</b>';
    const error = 'Failed"><img data-gallery-injected="error" src="missing-error.png" onerror="globalThis.__sniceGalleryInjected++">';
    const actionIcon = '<svg data-gallery-injected="icon" onload="globalThis.__sniceGalleryInjected++"><script>globalThis.__sniceGalleryInjected++</script><circle cx="12" cy="12" r="5"/></svg>';
    const actionLabel = '<img data-gallery-injected="action" src="missing-action.png" onerror="globalThis.__sniceGalleryInjected++">Camera';
    (globalThis as any).__sniceGalleryInjected = 0;

    const results = [];
    for (const view of ['grid', 'list'] as const) {
      const gallery = document.createElement('snice-file-gallery') as any;
      gallery.autoUpload = false;
      gallery.view = view;
      gallery.showDropzone = false;
      document.body.appendChild(gallery);
      await gallery.ready;

      const first = new File(['first'], fileName, { type: mimeType });
      const second = new File(['second'], '<strong data-gallery-injected="added">added.txt</strong>', { type: 'text/plain' });
      gallery.addFileWithPreview(first, preview);
      gallery.addFiles([second]);

      const firstFile = gallery.files[0];
      const secondFile = gallery.files[1];
      firstFile.uploadStatus = 'error';
      firstFile.error = error;
      gallery.setFileBadge(firstFile.id, badge, 'top-left');
      gallery.setFileBadge(
        secondFile.id,
        unsafeHTML('<span data-trusted-gallery-badge="true"><strong>JD</strong></span>'),
        'bottom-right'
      );
      const actionId = gallery.addCustomAction(actionIcon, actionLabel);
      gallery.addCustomAction(
        unsafeHTML('<svg data-trusted-gallery-icon="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/></svg>'),
        'Trusted camera'
      );
      await gallery.rendered;
      await new Promise(resolve => setTimeout(resolve, 50));

      const shadow = gallery.shadowRoot!;
      const fileItems = shadow.querySelectorAll<HTMLElement>('[data-file-id]');
      const firstItem = fileItems[0];
      const renderedName = firstItem.querySelector<HTMLElement>('.gallery-item-name')!;
      const image = firstItem.querySelector<HTMLImageElement>('.gallery-item-image')!;
      const renderedBadge = firstItem.querySelector<HTMLElement>('.gallery-item-badge')!;
      const renderedError = firstItem.querySelector<HTMLElement>('.gallery-item-error')!;
      const customAction = Array.from(
        shadow.querySelectorAll<HTMLElement>('.gallery-item--add-button')
      ).find(item => item.title === actionLabel)!;
      let clickedActionId = '';
      gallery.addEventListener('custom-action-click', (event: CustomEvent) => {
        clickedActionId = event.detail.actionId;
      });
      customAction.click();

      results.push({
        view,
        layout: shadow.querySelector('.gallery')?.classList.contains(`gallery--${view}`),
        fileCount: fileItems.length,
        fileNameText: renderedName.textContent?.trim() === first.name,
        fileNameTitle: renderedName.title === first.name,
        addedFileText: fileItems[1].querySelector('.gallery-item-name')?.textContent?.trim() === second.name,
        mimeNotRendered: !shadow.textContent?.includes(first.type),
        preview: image.getAttribute('src') === preview,
        previewHandler: image.getAttribute('onerror'),
        imageAlt: image.alt === first.name,
        badgeText: renderedBadge.textContent?.trim() === badge,
        badgePosition: renderedBadge.classList.contains('gallery-item-badge--top-left'),
        errorTitle: renderedError.title === error,
        errorText: renderedError.textContent === 'Upload failed',
        actionTitle: customAction.title === actionLabel,
        actionLabel: customAction.querySelector('.gallery-item-name')?.textContent?.trim() === actionLabel,
        actionIcon: customAction.querySelector('.gallery-item-add-icon')?.textContent?.trim() === actionIcon,
        actionClick: clickedActionId === actionId,
        trustedBadge: shadow.querySelector('[data-trusted-gallery-badge] strong')?.textContent === 'JD',
        trustedIcon: Boolean(shadow.querySelector('[data-trusted-gallery-icon] circle')),
        injectedNodes: shadow.querySelectorAll('[data-gallery-injected]').length,
        scripts: shadow.querySelectorAll('script').length
      });
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      executed: (globalThis as any).__sniceGalleryInjected,
      documentInjectedNodes: document.querySelectorAll('[data-gallery-injected]').length,
      results
    };
  }, build);
}

const inertFileGalleryDataResult = {
  executed: 0,
  documentInjectedNodes: 0,
  results: ['grid', 'list'].map(view => ({
    view,
    layout: true,
    fileCount: 2,
    fileNameText: true,
    fileNameTitle: true,
    addedFileText: true,
    mimeNotRendered: true,
    preview: true,
    previewHandler: null,
    imageAlt: true,
    badgeText: true,
    badgePosition: true,
    errorTitle: true,
    errorText: true,
    actionTitle: true,
    actionLabel: true,
    actionIcon: true,
    actionClick: true,
    trustedBadge: true,
    trustedIcon: true,
    injectedNodes: 0,
    scripts: 0
  }))
};

async function exerciseUntrustedTreeData(
  page: Page,
  build: 'source' | 'distribution' | 'cdn'
) {
  await page.goto('/guide.html');
  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/tree/snice-tree.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/tree/snice-tree.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-tree.min.js' });
  }
  await page.waitForFunction(() => !!customElements.get('snice-tree'));

  return page.evaluate(async () => {
    const maliciousIcon = '<img data-tree-injected="icon" src="missing-icon.png" onerror="globalThis.__sniceTreeInjected++"><svg data-tree-injected="svg" onload="globalThis.__sniceTreeInjected++"><script>globalThis.__sniceTreeInjected++</script></svg>';
    const quotedImage = 'missing.png" onerror="globalThis.__sniceTreeInjected++" data-tree-injected="image';
    const dynamicIcon = '<svg data-tree-injected="dynamic" onload="globalThis.__sniceTreeInjected++"></svg>';
    (globalThis as any).__sniceTreeInjected = 0;

    const tree = document.createElement('snice-tree') as any;
    tree.nodes = [{
      id: 'root', label: 'Root', icon: '📁', expanded: true, children: [
        { id: 'text', label: 'Text icon', icon: maliciousIcon },
        { id: 'quoted', label: 'Quoted image', icon: quotedImage, iconImage: quotedImage },
        { id: 'javascript', label: 'Script image', iconImage: 'javascript:globalThis.__sniceTreeInjected++' },
        { id: 'svg-data', label: 'SVG data', icon: 'SVG fallback', iconImage: 'data:image/svg+xml,<svg onload=globalThis.__sniceTreeInjected++></svg>' },
        { id: 'valid', label: 'Valid image', icon: 'Image fallback', iconImage: '/assets/flags/us.png' },
        { id: 'branch', label: 'Branch', icon: '📁', expanded: true, children: [
          { id: 'leaf', label: 'Leaf', icon: maliciousIcon, iconImage: quotedImage },
          { id: 'sibling', label: 'Sibling', icon: '📄' }
        ] }
      ]
    }];
    document.body.appendChild(tree);
    await tree.ready;

    const collectItems = () => {
      const result: any[] = [];
      const visit = (item: any) => {
        result.push(item);
        item.shadowRoot
          ?.querySelectorAll('.tree-item__children > snice-tree-item')
          .forEach((child: any) => visit(child));
      };
      tree.shadowRoot
        ?.querySelectorAll('.tree__content > snice-tree-item')
        .forEach((item: any) => visit(item));
      return result;
    };

    const readyDeadline = performance.now() + 5000;
    let items = collectItems();
    while (
      (items.length !== 9 || items.some(item => !item.shadowRoot))
      && performance.now() < readyDeadline
    ) {
      await new Promise(resolve => setTimeout(resolve, 20));
      items = collectItems();
    }
    if (items.length !== 9 || items.some(item => !item.shadowRoot)) {
      const branch = items.find(item => item.node?.id === 'branch');
      throw new Error(JSON.stringify({
        message: 'Tree descendants did not finish rendering',
        itemIds: items.map(item => item.node?.id),
        branchNode: branch?.node,
        branchShadow: branch?.shadowRoot?.innerHTML
      }));
    }

    let byId = new Map(items.map(item => [item.node.id, item]));
    const textItem = byId.get('text')!;
    const quotedItem = byId.get('quoted')!;
    const javascriptItem = byId.get('javascript')!;
    const svgDataItem = byId.get('svg-data')!;
    const validItem = byId.get('valid')!;
    const rootItem = byId.get('root')!;
    const branchItem = byId.get('branch')!;
    const leafItem = byId.get('leaf')!;

    const before = {
      itemCount: items.length,
      labels: items.map(item => item.shadowRoot.querySelector('.tree-item__label')?.textContent),
      textIcon: textItem.shadowRoot.querySelector('[part="icon-text"]')?.textContent,
      quotedFallback: quotedItem.shadowRoot.querySelector('[part="icon-text"]')?.textContent,
      javascriptImage: Boolean(javascriptItem.shadowRoot.querySelector('img')),
      javascriptHidden: javascriptItem.shadowRoot.querySelector('.tree-item__icon')?.style.display === 'none',
      svgFallback: svgDataItem.shadowRoot.querySelector('[part="icon-text"]')?.textContent,
      validImageAttribute: validItem.shadowRoot.querySelector('img')?.getAttribute('src'),
      validImageProperty: validItem.shadowRoot.querySelector('img')?.src.endsWith('/assets/flags/us.png'),
      validImageHandler: validItem.shadowRoot.querySelector('img')?.getAttribute('onerror'),
      leafText: leafItem.shadowRoot.querySelector('[part="icon-text"]')?.textContent,
      rootChildren: rootItem.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item').length,
      branchChildren: branchItem.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item').length,
      rootExpanded: rootItem.expanded,
      branchExpanded: branchItem.expanded,
      injectedNodes: items.reduce(
        (count, item) => count + item.shadowRoot.querySelectorAll('[data-tree-injected]').length,
        0
      ),
      scripts: items.reduce(
        (count, item) => count + item.shadowRoot.querySelectorAll('script').length,
        0
      )
    };

    tree.showIcons = false;
    await new Promise(resolve => setTimeout(resolve, 40));
    const iconsHidden = collectItems().every(item =>
      item.shadowRoot.querySelector('.tree-item__icon')?.style.display === 'none'
    );
    tree.showIcons = true;
    await new Promise(resolve => setTimeout(resolve, 40));
    items = collectItems();
    byId = new Map(items.map(item => [item.node.id, item]));
    const iconsRestored = byId.get('text')!.shadowRoot.querySelector('.tree-item__icon')?.style.display !== 'none'
      && Boolean(byId.get('valid')!.shadowRoot.querySelector('img'));

    const validImage = byId.get('valid')!.shadowRoot.querySelector('img')!;
    validImage.dispatchEvent(new Event('error'));
    await byId.get('valid')!.rendered;
    const imageFallback = byId.get('valid')!.shadowRoot.querySelector('[part="icon-text"]')?.textContent;

    tree.updateNode('text', { icon: dynamicIcon });
    await new Promise(resolve => setTimeout(resolve, 100));
    items = collectItems();
    byId = new Map(items.map(item => [item.node.id, item]));
    const dynamicItem = byId.get('text')!;

    await new Promise(resolve => setTimeout(resolve, 100));
    const after = {
      dynamicText: dynamicItem.shadowRoot.querySelector('[part="icon-text"]')?.textContent,
      dynamicInjected: dynamicItem.shadowRoot.querySelectorAll('[data-tree-injected]').length,
      hierarchyIntact: items.length === 9
        && byId.get('branch')!.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item').length === 2,
      executed: (globalThis as any).__sniceTreeInjected,
      documentInjectedNodes: document.querySelectorAll('[data-tree-injected]').length
    };

    tree.remove();
    return { before, iconsHidden, iconsRestored, imageFallback, after };
  });
}

const inertTreeDataResult = {
  before: {
    itemCount: 9,
    labels: [
      'Root',
      'Text icon',
      'Quoted image',
      'Script image',
      'SVG data',
      'Valid image',
      'Branch',
      'Leaf',
      'Sibling'
    ],
    textIcon: '<img data-tree-injected="icon" src="missing-icon.png" onerror="globalThis.__sniceTreeInjected++"><svg data-tree-injected="svg" onload="globalThis.__sniceTreeInjected++"><script>globalThis.__sniceTreeInjected++</script></svg>',
    quotedFallback: 'missing.png" onerror="globalThis.__sniceTreeInjected++" data-tree-injected="image',
    javascriptImage: false,
    javascriptHidden: true,
    svgFallback: 'SVG fallback',
    validImageAttribute: '/assets/flags/us.png',
    validImageProperty: true,
    validImageHandler: null,
    leafText: '<img data-tree-injected="icon" src="missing-icon.png" onerror="globalThis.__sniceTreeInjected++"><svg data-tree-injected="svg" onload="globalThis.__sniceTreeInjected++"><script>globalThis.__sniceTreeInjected++</script></svg>',
    rootChildren: 6,
    branchChildren: 2,
    rootExpanded: true,
    branchExpanded: true,
    injectedNodes: 0,
    scripts: 0
  },
  iconsHidden: true,
  iconsRestored: true,
  imageFallback: 'Image fallback',
  after: {
    dynamicText: '<svg data-tree-injected="dynamic" onload="globalThis.__sniceTreeInjected++"></svg>',
    dynamicInjected: 0,
    hierarchyIntact: true,
    executed: 0,
    documentInjectedNodes: 0
  }
};

async function exerciseUntrustedSelectData(page: Page, build: 'distribution' | 'cdn') {
  await page.goto('/guide.html');
  if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/select/snice-select.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-select.min.js' });
  }
  await page.waitForFunction(() => !!customElements.get('snice-select'));

  return page.evaluate(async () => {
    const maliciousLabel = '<img data-select-injected="label" src="missing-label.png" onerror="globalThis.__sniceSelectInjected++"><svg><script>globalThis.__sniceSelectInjected++</script></svg>';
    const maliciousValue = 'value" tabindex="0" data-select-injected="value';
    const maliciousIcon = 'missing-icon.png" onerror="globalThis.__sniceSelectInjected++" data-select-injected="icon';
    const maliciousPlaceholder = '<img data-select-injected="placeholder" src="missing-placeholder.png" onerror="globalThis.__sniceSelectInjected++">';
    const secondValue = 'second" aria-label="forged';
    const secondLabel = '<b data-select-injected="second">Second</b>';
    (globalThis as any).__sniceSelectInjected = 0;

    const selected = document.createElement('snice-select') as any;
    selected.options = [{ value: maliciousValue, label: maliciousLabel, icon: maliciousIcon }];
    selected.value = maliciousValue;
    document.body.appendChild(selected);
    await selected.ready;

    const multiple = document.createElement('snice-select') as any;
    multiple.multiple = true;
    multiple.options = [
      { value: maliciousValue, label: maliciousLabel, icon: maliciousIcon },
      { value: secondValue, label: secondLabel }
    ];
    multiple.value = `${maliciousValue},${secondValue}`;
    document.body.appendChild(multiple);
    await multiple.ready;

    const placeholder = document.createElement('snice-select') as any;
    placeholder.placeholder = maliciousPlaceholder;
    document.body.appendChild(placeholder);
    await placeholder.ready;

    const declarative = document.createElement('snice-select') as any;
    const declarativeOption = document.createElement('snice-option');
    declarativeOption.setAttribute('value', maliciousValue);
    declarativeOption.setAttribute('icon', maliciousIcon);
    declarativeOption.textContent = maliciousLabel;
    declarative.appendChild(declarativeOption);
    document.body.appendChild(declarative);
    await declarative.ready;

    const remote = document.createElement('snice-select') as any;
    remote.remote = true;
    remote.searchable = true;
    document.body.appendChild(remote);
    await remote.ready;
    remote.addEventListener('@request/select/search', (event: CustomEvent) => {
      event.detail.discovery.resolve();
      event.detail.data.resolve([{
        value: maliciousValue,
        label: maliciousLabel,
        icon: maliciousIcon
      }]);
    });
    await remote.performRemoteSearch('adversarial query');

    selected.options = [{
      value: 'dynamic" data-select-injected="dynamic',
      label: '<img data-select-injected="dynamic-label" src="missing-dynamic.png">',
      icon: maliciousIcon
    }];
    selected.value = 'dynamic" data-select-injected="dynamic';
    await new Promise(resolve => setTimeout(resolve, 100));

    const selectedShadow = selected.shadowRoot!;
    const multipleShadow = multiple.shadowRoot!;
    const placeholderShadow = placeholder.shadowRoot!;
    const declarativeShadow = declarative.shadowRoot!;
    const remoteShadow = remote.shadowRoot!;
    const shadows = [selectedShadow, multipleShadow, placeholderShadow, declarativeShadow, remoteShadow];
    const option = selectedShadow.querySelector('.select-option') as HTMLElement;
    const icon = option.querySelector('.select-option-icon') as HTMLImageElement;

    return {
      executed: (globalThis as any).__sniceSelectInjected,
      injectedNodes: document.querySelectorAll('[data-select-injected]').length
        + shadows.reduce((count, shadow) => count + shadow.querySelectorAll('[data-select-injected]').length, 0),
      scripts: shadows.reduce((count, shadow) => count + shadow.querySelectorAll('script').length, 0),
      dynamicLabel: selectedShadow.querySelector('.select-option-label')?.textContent,
      dynamicValue: option.getAttribute('data-value'),
      forgedTabIndex: option.getAttribute('tabindex'),
      iconSource: icon.getAttribute('src'),
      iconHandler: icon.getAttribute('onerror'),
      multipleLabels: Array.from(multipleShadow.querySelectorAll('.select-tag')).map(tag => tag.textContent),
      multipleValues: Array.from(multipleShadow.querySelectorAll('.select-tag-remove')).map(tag => tag.getAttribute('data-value')),
      placeholder: placeholderShadow.querySelector('.select-placeholder')?.textContent,
      declarativeLabel: declarativeShadow.querySelector('.select-option-label')?.textContent,
      remoteLabel: remoteShadow.querySelector('.select-option-label')?.textContent,
      remoteValue: remoteShadow.querySelector('.select-option')?.getAttribute('data-value'),
      remoteIconHandler: remoteShadow.querySelector('.select-option-icon')?.getAttribute('onerror')
    };
  });
}

const inertSelectDataResult = {
  executed: 0,
  injectedNodes: 0,
  scripts: 0,
  dynamicLabel: '<img data-select-injected="dynamic-label" src="missing-dynamic.png">',
  dynamicValue: 'dynamic" data-select-injected="dynamic',
  forgedTabIndex: null,
  iconSource: 'missing-icon.png" onerror="globalThis.__sniceSelectInjected++" data-select-injected="icon',
  iconHandler: null,
  multipleLabels: [
    '<img data-select-injected="label" src="missing-label.png" onerror="globalThis.__sniceSelectInjected++"><svg><script>globalThis.__sniceSelectInjected++</script></svg>×',
    '<b data-select-injected="second">Second</b>×'
  ],
  multipleValues: [
    'value" tabindex="0" data-select-injected="value',
    'second" aria-label="forged'
  ],
  placeholder: '<img data-select-injected="placeholder" src="missing-placeholder.png" onerror="globalThis.__sniceSelectInjected++">',
  declarativeLabel: '<img data-select-injected="label" src="missing-label.png" onerror="globalThis.__sniceSelectInjected++"><svg><script>globalThis.__sniceSelectInjected++</script></svg>',
  remoteLabel: '<img data-select-injected="label" src="missing-label.png" onerror="globalThis.__sniceSelectInjected++"><svg><script>globalThis.__sniceSelectInjected++</script></svg>',
  remoteValue: 'value" tabindex="0" data-select-injected="value',
  remoteIconHandler: null
};

test.describe('declarative rendering framework in a real browser', () => {
  test('renders file-gallery metadata safely through the source component', async ({ page }) => {
    expect(await exerciseUntrustedFileGalleryData(page, 'source')).toEqual(inertFileGalleryDataResult);
  });

  test('renders file-gallery metadata safely through the built ESM component', async ({ page }) => {
    expect(await exerciseUntrustedFileGalleryData(page, 'distribution')).toEqual(inertFileGalleryDataResult);
  });

  test('renders file-gallery metadata safely through the CDN component', async ({ page }) => {
    expect(await exerciseUntrustedFileGalleryData(page, 'cdn')).toEqual(inertFileGalleryDataResult);
  });

  test('renders tree icon data safely through the source component', async ({ page }) => {
    expect(await exerciseUntrustedTreeData(page, 'source')).toEqual(inertTreeDataResult);
  });

  test('renders tree icon data safely through the built ESM component', async ({ page }) => {
    expect(await exerciseUntrustedTreeData(page, 'distribution')).toEqual(inertTreeDataResult);
  });

  test('renders tree icon data safely through the CDN component', async ({ page }) => {
    expect(await exerciseUntrustedTreeData(page, 'cdn')).toEqual(inertTreeDataResult);
  });

  test('deep reactivity uses native Proxy and Reflect semantics in a real browser', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const { createDeepReactive } = await import('/packages/core/src/reactive.ts');
      let changes = 0;
      const key = { id: 1 };
      const source: any = {
        nested: { count: 0 },
        map: new Map([[key, { label: 'first' }]]),
        set: new Set([key])
      };
      source.self = source;
      const state = createDeepReactive(source, () => { changes++; });
      const proxyKey = [...state.map.keys()][0];

      state.nested.count++;
      state.map.get(proxyKey).label = 'second';
      state.map.set(proxyKey, { label: 'third' });
      state.set.delete(proxyKey);
      Reflect.set(state.nested, 'extra', true);

      return {
        proxyAvailable: typeof Proxy === 'function',
        reflectAvailable: typeof Reflect.set === 'function',
        cyclePreserved: state.self === state,
        mapKeyInterop: state.map.has(proxyKey) && state.map.has(key),
        mapValue: state.map.get(key).label,
        setRemoved: !state.set.has(key),
        reflectedWrite: state.nested.extra,
        changes
      };
    });

    expect(result).toEqual({
      proxyAvailable: true,
      reflectAvailable: true,
      cyclePreserved: true,
      mapKeyInterop: true,
      mapValue: 'third',
      setRemoved: true,
      reflectedWrite: true,
      changes: 5
    });
  });

  test('runs the complete customer workflow through the built ESM distribution', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const fixture = await import('/tests/live/fixtures/built-customer-declarative.ts');
      return fixture.exerciseBuiltCustomerScenario();
    });

    expect(result.rendering).toEqual({
      bound: true,
      style: true,
      keyedIdentity: true,
      fallback: true,
      asyncValue: true,
      currentView: 'beta'
    });
    expect(result.parked).toEqual({
      calls: [0, 0],
      bound: 'from-view'
    });
    expect(result.initialOnceCalls).toBe(1);
    expect(result.identityAfterParking).toBe(true);
    expect(result.afterParkingCalls).toEqual([1, 1]);
    expect(result.afterParkingOnceCalls).toBe(1);
    expect(result.detached).toEqual({
      calls: [2, 2],
      bound: 'detached-write',
      once: 1
    });
    expect(result.identityAfterHostReconnect).toBe(true);
  });

  test('reconciles the built repeat implementation in table, select, and SVG contexts', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const fixture = await import('/tests/live/fixtures/built-customer-declarative.ts');
      return fixture.exerciseBuiltRepeatContextsScenario();
    });

    expect(result).toEqual({
      parents: ['TBODY', 'SELECT'],
      svgNamespace: 'http://www.w3.org/2000/svg',
      identities: [true, true, true],
      rows: ['two updated', 'one updated', 'three'],
      options: ['two updated', 'one updated', 'three'],
      circlePositions: ['1', '2', '3']
    });
  });

  test('handles stale, completed, cancelled, and restarted async values through the built ESM distribution', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const fixture = await import('/tests/live/fixtures/built-customer-declarative.ts');
      return fixture.exerciseBuiltAsyncLifecycleScenario();
    });

    expect(result).toEqual({
      staleIgnored: true,
      currentRendered: true,
      streamedTemplate: true,
      completedOpenCount: 1,
      cancellation: 1,
      restarted: 2
    });
  });

  test('renders untrusted select data inertly through the built ESM component distribution', async ({ page }) => {
    expect(await exerciseUntrustedSelectData(page, 'distribution')).toEqual(inertSelectDataResult);
  });

  test('renders untrusted select data inertly through the built CDN bundle', async ({ page }) => {
    expect(await exerciseUntrustedSelectData(page, 'cdn')).toEqual(inertSelectDataResult);
  });
});
