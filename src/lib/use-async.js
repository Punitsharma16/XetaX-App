import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal data hook: runs `fn` on mount (and when `deps` change), exposes
 * loading / error / data plus `reload()` for pull-to-refresh. Ignores results
 * from a call that has since been superseded.
 */
export function useAsync(fn, deps = [], options) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const seq = useRef(0);
  const enabled = options?.enabled ?? true;

  const run = useCallback(async (isRefresh = false) => {
    const my = ++seq.current;
    if (isRefresh) setRefreshing(true);else setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (my === seq.current) setData(result);
    } catch (e) {
      if (my === seq.current) setError(e?.message || 'Something went wrong');
    } finally {
      if (my === seq.current) {setLoading(false);setRefreshing(false);}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {if (enabled) run(false);else setLoading(false);}, [run, enabled]);

  return { data, error, loading, refreshing, reload: () => run(true), setData };
}
