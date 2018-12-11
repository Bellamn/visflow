import {
  HistoryState,
  HistoryEvent,
  HistoryNodeEvent,
  HistoryDiagramEvent,
  HistoryEventLevel,
  HistoryInteractionEvent,
  HistoryCompositeEvent,
  HistoryLog,
  HistoryLogType,
} from '@/store/history/types';
import { getNode, resetDataflow } from '@/store/dataflow/helper';
import store from '@/store';
const UNDO_STACK_SIZE = 100;


const executeDiagramRedo = (evt: HistoryDiagramEvent) => {
  store.commit('dataflow/redo', evt);
};

const executeNodeRedo = (evt: HistoryNodeEvent) => {
  getNode(evt.nodeId).redo(evt);
};

const executeInteractionRedo = (evt: HistoryInteractionEvent) => {
  store.commit('interaction/redo', evt);
};

const executeCompositeRedo = (evt: HistoryCompositeEvent) => {
  evt.events.forEach(event => executeRedo(event));
};

export const executeRedo = (evt: HistoryEvent | HistoryCompositeEvent) => {
  if (evt.level === HistoryEventLevel.DIAGRAM) {
    executeDiagramRedo(evt as HistoryDiagramEvent);
  } else if (evt.level === HistoryEventLevel.NODE) {
    executeNodeRedo(evt as HistoryNodeEvent);
  } else if (evt.level === HistoryEventLevel.INTERACTION) {
    executeInteractionRedo(evt as HistoryInteractionEvent);
  } else if (evt.level === HistoryEventLevel.COMPOSITE) {
    executeCompositeRedo(evt as HistoryCompositeEvent);
  }
};

export const redo = (state: HistoryState) => {
  const evt = state.redoStack.pop();
  if (evt) {
    executeRedo(evt);
    state.undoStack.push(evt);
  }
};

export const batchRedo = (state: HistoryState, k: number) => {
  while (k--) {
    redo(state);
  }
};

const executeDiagramUndo = (evt: HistoryDiagramEvent) => {
  store.commit('dataflow/undo', evt);
};

const executeNodeUndo = (evt: HistoryNodeEvent) => {
  getNode(evt.nodeId).undo(evt);
};

const executeInteractionUndo = (evt: HistoryInteractionEvent) => {
  store.commit('interaction/undo', evt);
};

const executeCompositeUndo = (evt: HistoryCompositeEvent) => {
  const events = evt.events.concat().reverse();
  events.forEach(event => executeUndo(event));
};

export const executeUndo = (evt: HistoryEvent | HistoryCompositeEvent) => {
  if (evt.level === HistoryEventLevel.DIAGRAM) {
    executeDiagramUndo(evt as HistoryDiagramEvent);
  } else if (evt.level === HistoryEventLevel.NODE) {
    executeNodeUndo(evt as HistoryNodeEvent);
  } else if (evt.level === HistoryEventLevel.INTERACTION) {
    executeInteractionUndo(evt as HistoryInteractionEvent);
  } else if (evt.level === HistoryEventLevel.COMPOSITE) {
    executeCompositeUndo(evt as HistoryCompositeEvent);
  }
};

export const undo = (state: HistoryState) => {
  const evt = state.undoStack.pop();
  if (evt) {
    executeUndo(evt);
    state.redoStack.push(evt);
  }
};

export const batchUndo = (state: HistoryState, k: number) => {
  while (k--) {
    undo(state);
  }
};

const areNodeOptionTogglesCancellable = (evt1: HistoryNodeEvent, evt2: HistoryNodeEvent) => {
  if (evt1.level !== HistoryEventLevel.NODE || evt2.level !== HistoryEventLevel.NODE) {
    return false;
  }
  return evt1.type === evt2.type && evt1.type.match(/toggle/) !== null &&
    evt1.data.prevValue === evt2.data.value &&
    evt1.data.value === evt2.data.prevValue;
};

const areInteractionTogglesCancellable = (evt1: HistoryInteractionEvent, evt2: HistoryInteractionEvent) => {
  if (evt1.level !== HistoryEventLevel.INTERACTION || evt2.level !== HistoryEventLevel.INTERACTION) {
    return false;
  }
  return evt1.type === evt2.type && evt1.type.match(/toggle/) !== null &&
    evt1.data === !evt2.data;
};

/**
 * If the last two actions on the undo stack are toggling a same node/interaction option, remove them both as they
 * cancel each other and clutter the history.
 */
export const cancelToggles = (state: HistoryState) => {
  const undoStack = state.undoStack;
  if (undoStack.length < 2) {
    return;
  }
  const evt1 = undoStack[undoStack.length - 1];
  const evt2 = undoStack[undoStack.length - 2];
  const nodeOptionTogglesCancellable = areNodeOptionTogglesCancellable(evt1 as HistoryNodeEvent,
    evt2 as HistoryNodeEvent);
  const interactionTogglesCancellable = areInteractionTogglesCancellable(evt1 as HistoryInteractionEvent,
    evt2 as HistoryInteractionEvent);
  if (nodeOptionTogglesCancellable || interactionTogglesCancellable) {
    undoStack.splice(-2);
  }
};

/**
 * Reproduces all logged events for a diagram.
 * The diagram is reset to empty before this reproduction.
 */
export const reproduceLogs = (state: HistoryState, logs: HistoryLog[]) => {
  resetDataflow(false);
  state.logs = logs;
  state.currentLogIndex = -1; // no logs have been reproduced
};

/**
 * Reproduces the log pointed by currentLogIndex.
 */
export const redoLog = (state: HistoryState) => {
  if (state.currentLogIndex >= state.logs.length - 1) {
    console.warn('no more logs to redo');
    return;
  }
  const log = state.logs[++state.currentLogIndex];
  switch (log.type) {
    case HistoryLogType.UNDO:
      batchUndo(state, log.data as number);
      break;
    case HistoryLogType.REDO:
      batchRedo(state, log.data as number);
      break;
    case HistoryLogType.COMMIT:
      executeRedo(log.data as HistoryEvent);
      commitEvent(state, log.data as HistoryEvent);
      break;
    case HistoryLogType.CLEAR_DIAGRAM:
      // TODO
      break;
    case HistoryLogType.SAVE_DIAGRAM:
    case HistoryLogType.LOAD_DIAGRAM:
      // nothing to do
      break;
  }
};

export const commitEvent = (state: HistoryState, evt: HistoryEvent) => {
  state.undoStack.push(evt);
  cancelToggles(state);
  state.redoStack = [];
  if (state.undoStack.length > UNDO_STACK_SIZE) {
    state.undoStack.shift();
  }
};
