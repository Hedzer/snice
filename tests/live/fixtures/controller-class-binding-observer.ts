import {
  controller,
  element,
  getController,
  html,
  property,
  render,
  useNativeElementControllers
} from '../../../packages/core/src/index';

export const alphaName = 'live-class-controller-alpha';
export const betaName = 'live-class-controller-beta';

const counts = {
  alphaAttach: 0,
  alphaDetach: 0,
  betaAttach: 0,
  betaDetach: 0
};

@controller(alphaName)
class AlphaController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    this.element = element;
    counts.alphaAttach += 1;
  }

  async detach() {
    this.element = null;
    counts.alphaDetach += 1;
  }
}

@controller(betaName)
class BetaController {
  element: HTMLElement | null = null;

  async attach(element: HTMLElement) {
    this.element = element;
    counts.betaAttach += 1;
  }

  async detach() {
    this.element = null;
    counts.betaDetach += 1;
  }
}

@element('live-class-controller-host', { renderRoot: 'light' })
class ClassControllerHost extends HTMLElement {
  @property({ attribute: false }) controllerClass: unknown = AlphaController;
  @property() revision = 0;

  @render()
  template() {
    return html`
      <div
        id="live-class-controller-target"
        controller=${this.controllerClass}
        data-revision=${this.revision}
      ></div>
    `;
  }
}

type Snapshot = {
  stage: string;
  attribute: string | null;
  active: string | null;
  counts: typeof counts;
};

const settleObservers = () => new Promise<void>(resolve => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
});

function snapshot(stage: string, target: HTMLElement): Snapshot {
  return {
    stage,
    attribute: target.getAttribute('controller'),
    active: getController(target)?.constructor.name ?? null,
    counts: { ...counts }
  };
}

export async function runClassControllerObserverProof(): Promise<Snapshot[]> {
  useNativeElementControllers();
  Object.assign(counts, {
    alphaAttach: 0,
    alphaDetach: 0,
    betaAttach: 0,
    betaDetach: 0
  });

  document.querySelectorAll('live-class-controller-host').forEach(element => element.remove());
  await settleObservers();

  const host = document.createElement('live-class-controller-host') as ClassControllerHost;
  document.body.append(host);
  await (host as any).ready;
  await settleObservers();

  const target = host.querySelector('#live-class-controller-target') as HTMLElement;
  const snapshots = [snapshot('initial', target)];

  host.revision += 1;
  await (host as any).rendered;
  await settleObservers();
  snapshots.push(snapshot('same-class-rerender', target));

  // The document-level native-controller observer sees this light-DOM write.
  // It must restore Alpha's diagnostic name without taking the string path.
  target.setAttribute('controller', betaName);
  await settleObservers();
  snapshots.push(snapshot('external-overwrite', target));

  target.removeAttribute('controller');
  await settleObservers();
  snapshots.push(snapshot('external-removal', target));

  host.controllerClass = BetaController;
  await (host as any).rendered;
  await settleObservers();
  snapshots.push(snapshot('class-swap', target));

  host.remove();
  await settleObservers();
  snapshots.push(snapshot('disconnected', target));

  document.body.append(host);
  await settleObservers();
  snapshots.push(snapshot('reconnected', target));

  host.remove();
  await settleObservers();
  snapshots.push(snapshot('final-detach', target));

  return snapshots;
}
