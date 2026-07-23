export interface SniceGlobal {
  controllerRegistry: Map<string, any>;
  pendingControllerAttachments: Map<string, Set<HTMLElement>>;
  controllerIdCounter: number;
}
