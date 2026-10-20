import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs one cancellable async task at a time and exposes its progress message for BusyOverlay.
 * Unmounting the screen aborts the task so no state is set on a dead component.
 */
export function useAbortableTask() {
  const controllerRef = useRef<AbortController | undefined>(undefined);
  const [busyMessage, setBusyMessage] = useState<string | undefined>();

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(async <T,>(message: string, task: (signal: AbortSignal) => Promise<T>): Promise<T> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusyMessage(message);
    try {
      return await task(controller.signal);
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = undefined;
        setBusyMessage(undefined);
      }
    }
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = undefined;
    setBusyMessage(undefined);
  }, []);

  return { busyMessage, run, cancel };
}
