import { expect, test } from '@playwright/test';

test('class controller reflection is safe under a real MutationObserver', async ({ page }) => {
  const attachErrors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && message.text().includes('Failed to attach controller')) {
      attachErrors.push(message.text());
    }
  });

  await page.goto('/tests/live/fixtures/controller-class-binding-observer.html');

  const snapshots = await page.evaluate(async () => {
    const fixture = await import('/tests/live/fixtures/controller-class-binding-observer.ts');
    return fixture.runClassControllerObserverProof();
  });

  expect(snapshots).toEqual([
    {
      stage: 'initial',
      attribute: 'live-class-controller-alpha',
      active: 'AlphaController',
      counts: { alphaAttach: 1, alphaDetach: 0, betaAttach: 0, betaDetach: 0 }
    },
    {
      stage: 'same-class-rerender',
      attribute: 'live-class-controller-alpha',
      active: 'AlphaController',
      counts: { alphaAttach: 1, alphaDetach: 0, betaAttach: 0, betaDetach: 0 }
    },
    {
      stage: 'external-overwrite',
      attribute: 'live-class-controller-alpha',
      active: 'AlphaController',
      counts: { alphaAttach: 1, alphaDetach: 0, betaAttach: 0, betaDetach: 0 }
    },
    {
      stage: 'external-removal',
      attribute: 'live-class-controller-alpha',
      active: 'AlphaController',
      counts: { alphaAttach: 1, alphaDetach: 0, betaAttach: 0, betaDetach: 0 }
    },
    {
      stage: 'class-swap',
      attribute: 'live-class-controller-beta',
      active: 'BetaController',
      counts: { alphaAttach: 1, alphaDetach: 1, betaAttach: 1, betaDetach: 0 }
    },
    {
      stage: 'disconnected',
      attribute: null,
      active: null,
      counts: { alphaAttach: 1, alphaDetach: 1, betaAttach: 1, betaDetach: 1 }
    },
    {
      stage: 'reconnected',
      attribute: 'live-class-controller-beta',
      active: 'BetaController',
      counts: { alphaAttach: 1, alphaDetach: 1, betaAttach: 2, betaDetach: 1 }
    },
    {
      stage: 'final-detach',
      attribute: null,
      active: null,
      counts: { alphaAttach: 1, alphaDetach: 1, betaAttach: 2, betaDetach: 2 }
    }
  ]);
  expect(attachErrors).toEqual([]);
});
