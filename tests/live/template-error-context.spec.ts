import { expect, test } from '@playwright/test';

const systemChrome = process.env.SNICE_SYSTEM_CHROME;
if (systemChrome) test.use({ launchOptions: { executablePath: systemChrome } });

test('built host attribution ignores poisoned realm Object prototypes', async ({ page }) => {
  await page.goto('/guide.html');

  const result = await page.evaluate(async () => {
    const { Router, captureRenderHostIdentity, element } =
      await import('/dist/testing.esm.js');

    class PrimaryPoisonElement extends HTMLElement {}
    element('browser-context-primary-poison')(
      PrimaryPoisonElement,
      { kind: 'class', name: 'PrimaryPoisonElement', metadata: undefined },
    );
    const primaryHost = document.createElement('browser-context-primary-poison');

    const frame = document.createElement('iframe');
    document.body.append(frame);
    const alternateWindow = frame.contentWindow!;
    const alternateDocument = frame.contentDocument!;
    const target = alternateDocument.createElement('div');
    target.id = 'app';
    alternateDocument.body.append(target);
    const router = Router({
      target: '#app',
      type: 'hash',
      window: alternateWindow,
      document: alternateDocument,
    });
    class AlternatePoisonPage extends alternateWindow.HTMLElement {}
    router.page({ tag: 'browser-context-alt-poison', routes: ['/'] })(
      AlternatePoisonPage,
      { kind: 'class', name: 'AlternatePoisonPage', metadata: undefined },
    );
    const alternateHost = alternateDocument.createElement('browser-context-alt-poison');

    const reads = { ownerDocument: 0, defaultView: 0, customElements: 0 };
    const roots = new Set([Object.prototype, alternateWindow.Object.prototype]);
    let primaryLabel = '';
    let alternateLabel = '';
    try {
      for (const root of roots) {
        for (const key of Object.keys(reads)) {
          Object.defineProperty(root, key, {
            configurable: true,
            get() {
              reads[key as keyof typeof reads]++;
              throw new Error(`poisoned ${key}`);
            },
          });
        }
      }
      primaryLabel = captureRenderHostIdentity(primaryHost).label;
      alternateLabel = captureRenderHostIdentity(alternateHost).label;
    } finally {
      for (const root of roots) {
        delete (root as any).ownerDocument;
        delete (root as any).defaultView;
        delete (root as any).customElements;
      }
      frame.remove();
    }
    return { primaryLabel, alternateLabel, reads };
  });

  expect(result.primaryLabel).toMatch(/^<browser-context-primary-poison>/);
  expect(result.alternateLabel).toMatch(/^<browser-context-alt-poison>/);
  expect(result.reads).toEqual({ ownerDocument: 0, defaultView: 0, customElements: 0 });
});
