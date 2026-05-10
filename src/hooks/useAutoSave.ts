import { useCallback, useEffect, useRef } from 'react';

export function useAutoSave(delay = 1500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFn = useRef<(() => Promise<void>) | null>(null);

  const schedule = useCallback(
    (fn: () => Promise<void>) => {
      pendingFn.current = fn;

      if (timer.current) {
        clearTimeout(timer.current);
      }

      timer.current = setTimeout(async () => {
        if (pendingFn.current) {
          await pendingFn.current();
        }

        timer.current = null;
        pendingFn.current = null;
      }, delay);
    },
    [delay],
  );

  const flush = useCallback(async () => {
    if (!pendingFn.current) {
      return;
    }

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    const fn = pendingFn.current;
    pendingFn.current = null;
    await fn();
  }, []);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  return { schedule, flush };
}
