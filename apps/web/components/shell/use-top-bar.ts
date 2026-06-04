"use client";

import { useEffect } from "react";
import { type TopBarConfig, useTopBarStore } from "./top-bar-store";

/**
 * Publishes top-bar config for the current page. Clears on unmount.
 * Memoize `config` when it embeds elements that change every render.
 */
export function useTopBar(config: TopBarConfig | null) {
  useEffect(() => {
    useTopBarStore.getState().setConfig(config);
    return () => {
      useTopBarStore.getState().setConfig(null);
    };
  }, [config]);
}
