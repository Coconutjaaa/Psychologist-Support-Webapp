import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export type Resource<T> = {
  /** The loaded value; kept while reloading so the screen does not flash. */
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
  /** Updates the loaded value locally, e.g. with the item a create/update call returned. */
  mutate: (update: (current: T) => T) => void;
};

/**
 * Loads data from the API into state: `useResource(() => api.notes.list(patientId), [patientId])`.
 * List everything `load` depends on in `deps`; it reloads when they change. Render <LoadState> until `data` is set.
 */
export default function useResource<T>(load: () => Promise<T>, deps: DependencyList): Resource<T> {
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true });
  const loadRef = useRef(load);
  const latestRequest = useRef(0);

  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(() => {
    const request = ++latestRequest.current;
    setState((current) => ({ ...current, loading: true, error: undefined }));
    loadRef.current().then(
      (data) => {
        if (request === latestRequest.current) setState({ data, loading: false });
      },
      (error: unknown) => {
        if (request === latestRequest.current) setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error : new Error(String(error)) }));
      },
    );
  }, []);

  useEffect(reload, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const mutate = useCallback((update: (current: T) => T) => {
    setState((current) => (current.data === undefined ? current : { ...current, data: update(current.data) }));
  }, []);

  return { data: state.data, error: state.error, loading: state.loading, reload, mutate };
}
