import { expect, test } from '@playwright/test';

const systemChrome = process.env.SNICE_SYSTEM_CHROME;
if (systemChrome) test.use({ launchOptions: { executablePath: systemChrome } });

test('built host attribution uses exact registrations without consulting DOM identity properties', async ({ page }) => {
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

    document.adoptNode(alternateHost);
    const adoptedLabel = captureRenderHostIdentity(alternateHost).label;
    alternateDocument.adoptNode(alternateHost);

    class UndecoratedSubclass extends PrimaryPoisonElement {}
    customElements.define('browser-context-undecorated-subclass', UndecoratedSubclass);
    const subclassLabel = captureRenderHostIdentity(
      document.createElement('browser-context-undecorated-subclass'),
    ).label;

    class ExistingExactElement extends HTMLElement {}
    customElements.define('browser-context-existing-exact', ExistingExactElement);
    element('browser-context-existing-exact')(
      ExistingExactElement,
      { kind: 'class', name: 'ExistingExactElement', metadata: undefined },
    );
    const exactExistingLabel = captureRenderHostIdentity(
      document.createElement('browser-context-existing-exact'),
    ).label;

    class ExistingConflictElement extends HTMLElement {}
    customElements.define('browser-context-existing-conflict', ExistingConflictElement);
    class ConflictingElement extends HTMLElement {}
    element('browser-context-existing-conflict')(
      ConflictingElement,
      { kind: 'class', name: 'ConflictingElement', metadata: undefined },
    );
    const conflictingLabel = captureRenderHostIdentity(
      Object.create(ConflictingElement.prototype),
    ).label;

    class FailedElement extends HTMLElement {}
    const ownDefine = Object.getOwnPropertyDescriptor(customElements, 'define');
    Object.defineProperty(customElements, 'define', {
      configurable: true,
      value() { throw new Error('registration failed'); },
    });
    let failedRegistrationThrew = false;
    try {
      element('browser-context-failed-registration')(
        FailedElement,
        { kind: 'class', name: 'FailedElement', metadata: undefined },
      );
    } catch {
      failedRegistrationThrew = true;
    } finally {
      if (ownDefine) Object.defineProperty(customElements, 'define', ownDefine);
      else delete (customElements as any).define;
    }
    const failedRegistrationLabel = captureRenderHostIdentity(
      Object.create(FailedElement.prototype),
    ).label;

    const reads = { ownerDocument: 0, defaultView: 0, customElements: 0 };
    const roots = new Set([Object.prototype, alternateWindow.Object.prototype]);
    let primaryLabel = '';
    let alternateLabel = '';
    let ownPollutionLabel = '';
    let interfacePollutionLabel = '';
    let accessorConstructorLabel = '';
    let accessorConstructorReads = 0;
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

      for (const key of ['ownerDocument', 'defaultView', 'customElements', 'tagName', 'constructor']) {
        Object.defineProperty(primaryHost, key, {
          configurable: true,
          get() {
            if (key in reads) reads[key as keyof typeof reads]++;
            throw new Error(`hostile host ${key}`);
          },
        });
      }
      ownPollutionLabel = captureRenderHostIdentity(primaryHost).label;
      for (const key of ['ownerDocument', 'defaultView', 'customElements', 'tagName', 'constructor']) {
        delete (primaryHost as any)[key];
      }

      const primaryPrototype = PrimaryPoisonElement.prototype;
      for (const key of ['ownerDocument', 'defaultView', 'customElements']) {
        Object.defineProperty(primaryPrototype, key, {
          configurable: true,
          get() {
            reads[key as keyof typeof reads]++;
            throw new Error(`hostile prototype ${key}`);
          },
        });
      }
      for (const key of ['contains', 'getRootNode', 'cloneNode']) {
        Object.defineProperty(primaryPrototype, key, { configurable: true, value() {} });
      }
      interfacePollutionLabel = captureRenderHostIdentity(primaryHost).label;
      for (const key of ['ownerDocument', 'defaultView', 'customElements', 'contains', 'getRootNode', 'cloneNode']) {
        delete (primaryPrototype as any)[key];
      }

      const constructorDescriptor = Object.getOwnPropertyDescriptor(primaryPrototype, 'constructor')!;
      Object.defineProperty(primaryPrototype, 'constructor', {
        configurable: true,
        get() {
          accessorConstructorReads++;
          throw new Error('hostile prototype constructor');
        },
      });
      accessorConstructorLabel = captureRenderHostIdentity(primaryHost).label;
      Object.defineProperty(primaryPrototype, 'constructor', constructorDescriptor);
    } finally {
      for (const root of roots) {
        delete (root as any).ownerDocument;
        delete (root as any).defaultView;
        delete (root as any).customElements;
      }
      frame.remove();
    }

    const collisionFrames: HTMLIFrameElement[] = [];
    const createRouterRealm = () => {
      const collisionFrame = document.createElement('iframe');
      document.body.append(collisionFrame);
      collisionFrames.push(collisionFrame);
      const collisionWindow = collisionFrame.contentWindow!;
      const collisionDocument = collisionFrame.contentDocument!;
      const collisionTarget = collisionDocument.createElement('div');
      collisionTarget.id = 'app';
      collisionDocument.body.append(collisionTarget);
      return { collisionWindow, collisionDocument };
    };
    const registerInRealm = (
      realm: ReturnType<typeof createRouterRealm>,
      constructor: typeof HTMLElement,
      tag: string,
    ) => {
      Router({
        target: '#app',
        type: 'hash',
        window: realm.collisionWindow,
        document: realm.collisionDocument,
      }).page({ tag, routes: ['/'] })(
        constructor,
        { kind: 'class', name: constructor.name, metadata: undefined },
      );
    };

    const sameRealm = createRouterRealm();
    registerInRealm(sameRealm, PrimaryPoisonElement, 'browser-context-primary-poison');
    const sameRegistryHasConstructor = sameRealm.collisionWindow.customElements.get(
      'browser-context-primary-poison',
    ) === PrimaryPoisonElement;
    const sameRegistryTagLabel = captureRenderHostIdentity(primaryHost).label;
    const sameRegistryTagNewLabel = captureRenderHostIdentity(
      new PrimaryPoisonElement(),
    ).label;

    const distinctRealm = createRouterRealm();
    registerInRealm(distinctRealm, PrimaryPoisonElement, 'browser-context-primary-distinct');
    const distinctOldLabel = captureRenderHostIdentity(primaryHost).label;
    const distinctNewLabel = captureRenderHostIdentity(
      new PrimaryPoisonElement(),
    ).label;

    const originalAgainRealm = createRouterRealm();
    registerInRealm(originalAgainRealm, PrimaryPoisonElement, 'browser-context-primary-poison');
    const permanentAmbiguousLabel = captureRenderHostIdentity(primaryHost).label;

    class PreservedCrossRegistryElement extends HTMLElement {}
    element('browser-context-preserved-cross-registry')(
      PreservedCrossRegistryElement,
      { kind: 'class', name: 'PreservedCrossRegistryElement', metadata: undefined },
    );
    const preservedHost = document.createElement('browser-context-preserved-cross-registry');
    const failedRealm = createRouterRealm();
    const failedRealmDefine = Object.getOwnPropertyDescriptor(
      failedRealm.collisionWindow.customElements,
      'define',
    );
    Object.defineProperty(failedRealm.collisionWindow.customElements, 'define', {
      configurable: true,
      value() { throw new Error('cross-registry registration failed'); },
    });
    let failedCrossRegistryThrew = false;
    try {
      registerInRealm(
        failedRealm,
        PreservedCrossRegistryElement,
        'browser-context-preserved-cross-registry-conflict',
      );
    } catch {
      failedCrossRegistryThrew = true;
    } finally {
      if (failedRealmDefine) {
        Object.defineProperty(
          failedRealm.collisionWindow.customElements,
          'define',
          failedRealmDefine,
        );
      } else {
        delete (failedRealm.collisionWindow.customElements as any).define;
      }
    }
    const failedCrossRegistryPreservedLabel = captureRenderHostIdentity(preservedHost).label;
    collisionFrames.forEach(collisionFrame => collisionFrame.remove());

    return {
      primaryLabel,
      alternateLabel,
      adoptedLabel,
      subclassLabel,
      exactExistingLabel,
      conflictingLabel,
      failedRegistrationThrew,
      failedRegistrationLabel,
      ownPollutionLabel,
      interfacePollutionLabel,
      accessorConstructorLabel,
      accessorConstructorReads,
      sameRegistryTagLabel,
      sameRegistryTagNewLabel,
      sameRegistryHasConstructor,
      distinctOldLabel,
      distinctNewLabel,
      permanentAmbiguousLabel,
      failedCrossRegistryThrew,
      failedCrossRegistryPreservedLabel,
      reads,
    };
  });

  expect(result.primaryLabel).toMatch(/^<browser-context-primary-poison>/);
  expect(result.alternateLabel).toMatch(/^<browser-context-alt-poison>/);
  expect(result.adoptedLabel).toMatch(/^<browser-context-alt-poison>/);
  expect(result.subclassLabel).toBe('<element>');
  expect(result.exactExistingLabel).toMatch(/^<browser-context-existing-exact>/);
  expect(result.conflictingLabel).toBe('<element>');
  expect(result.failedRegistrationThrew).toBe(true);
  expect(result.failedRegistrationLabel).toBe('<element>');
  expect(result.ownPollutionLabel).toMatch(/^<browser-context-primary-poison>/);
  expect(result.interfacePollutionLabel).toMatch(/^<browser-context-primary-poison>/);
  expect(result.accessorConstructorLabel).toBe('<element>');
  expect(result.accessorConstructorReads).toBe(0);
  expect(result.sameRegistryTagLabel).toMatch(/^<browser-context-primary-poison>/);
  expect(result.sameRegistryTagNewLabel).toMatch(/^<browser-context-primary-poison>/);
  expect(result.sameRegistryHasConstructor).toBe(true);
  expect(result.distinctOldLabel).toBe('<element>');
  expect(result.distinctNewLabel).toBe('<element>');
  expect(result.permanentAmbiguousLabel).toBe('<element>');
  expect(result.failedCrossRegistryThrew).toBe(true);
  expect(result.failedCrossRegistryPreservedLabel).toMatch(
    /^<browser-context-preserved-cross-registry>/,
  );
  expect(result.reads).toEqual({ ownerDocument: 0, defaultView: 0, customElements: 0 });
});
