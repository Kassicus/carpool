"use client";

import { ReactNode, useEffect, useContext, createContext } from "react";

// Import from the context module
import { usePageHeader } from "./page-header-context";

interface SetPageHeaderProps {
  title: string;
  backHref?: string;
  rightAction?: ReactNode;
}

export default function SetPageHeader({ title, backHref, rightAction }: SetPageHeaderProps) {
  usePageHeader({ title, backHref, rightAction });
  return null;
}
