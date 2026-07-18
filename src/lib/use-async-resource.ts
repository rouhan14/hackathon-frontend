"use client";

import { useCallback, useEffect, useState } from "react";

export type AsyncResource<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "ready"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: Error };

export function useAsyncResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  dependencies: React.DependencyList,
) {
  const [state, setState] = useState<AsyncResource<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => {
        if (!controller.signal.aborted) setState({ status: "loading" });
        return loader(controller.signal);
      })
      .then((data) => setState({ status: "ready", data }))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          error: reason instanceof Error ? reason : new Error("Something went wrong."),
        });
      });
    return () => controller.abort();
    // The caller supplies the loader's dependencies explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, retry };
}
