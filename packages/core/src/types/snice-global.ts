export interface SniceGlobal {
  controllerRegistry: Map<string, any>;
  pendingControllerAttachments: Map<string, Set<HTMLElement>>;
  controllerIdCounter: number;
}

declare global {
  const __SNICE_DEV__: boolean | undefined;
}
