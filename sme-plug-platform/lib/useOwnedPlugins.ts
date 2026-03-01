"use client";

import useSWR from "swr";
import { useCallback } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useOwnedPlugins() {
    const { data, error, isLoading, mutate } = useSWR(
        "/api/plugins/owned",
        fetcher,
        {
            revalidateOnFocus: true,
        }
    );

    const owned: string[] = data?.owned || [];
    const ready = !isLoading && !error;

    const buyPlugin = useCallback(
        async (plugId: string) => {
            try {
                // Optimistic UI update
                mutate({ owned: [...owned, plugId] }, false);

                const res = await fetch("/api/plugins/buy", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plugId }),
                });

                if (res.ok) {
                    const result = await res.json();
                    mutate(result); // sync with real DB state
                } else {
                    // revert on error
                    mutate();
                }
            } catch {
                mutate();
            }
        },
        [owned, mutate]
    );

    const isOwned = useCallback(
        (plugId: string) => owned.includes(plugId),
        [owned]
    );

    return { owned, buyPlugin, isOwned, ready };
}
