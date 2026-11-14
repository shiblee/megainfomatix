import { useCallback, useEffect, useState } from 'react';

/**
 * Run an async function (usually a service call) on mount / when deps change.
 * The function receives an AbortSignal so in-flight requests are cancelled on unmount.
 *
 *   const { data, error, isLoading, reload } = useAsync((signal) => systemService.getHealth({ signal }), []);
 */
export default function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, isLoading: true });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, isLoading: true }));

    asyncFn(controller.signal).then(
      (data) => setState({ data, error: null, isLoading: false }),
      (error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, isLoading: false });
      },
    );

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
}
