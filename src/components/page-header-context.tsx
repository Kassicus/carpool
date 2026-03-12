"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface PageHeaderConfig {
  title: string;
  backHref?: string;
  rightAction?: ReactNode;
}

interface PageHeaderContextValue {
  config: PageHeaderConfig | null;
  setConfig: (config: PageHeaderConfig) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<PageHeaderConfig | null>(null);

  const setConfig = useCallback((c: PageHeaderConfig) => {
    setConfigState(c);
  }, []);

  return (
    <PageHeaderContext.Provider value={{ config, setConfig }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader(config: PageHeaderConfig) {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeader must be used within PageHeaderProvider");

  const { setConfig } = ctx;
  const serialized = JSON.stringify({ title: config.title, backHref: config.backHref });

  useEffect(() => {
    setConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, setConfig]);
}

export function usePageHeaderValue() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeaderValue must be used within PageHeaderProvider");
  return ctx.config;
}
