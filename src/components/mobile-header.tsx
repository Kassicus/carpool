"use client";

import Link from "next/link";
import { usePageHeaderValue } from "./page-header-context";

export default function MobileHeader() {
  const config = usePageHeaderValue();

  if (!config) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white sm:hidden">
      <div className="flex h-14 items-center px-4">
        {/* Back arrow */}
        {config.backHref ? (
          <Link
            href={config.backHref}
            className="flex h-11 w-11 items-center justify-center -ml-2"
          >
            <svg
              className="h-5 w-5 text-text"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Link>
        ) : (
          <div className="w-7" />
        )}

        {/* Title */}
        <h1 className="flex-1 text-center font-semibold text-text truncate">
          {config.title}
        </h1>

        {/* Right action */}
        {config.rightAction ? (
          <div className="flex items-center">{config.rightAction}</div>
        ) : (
          <div className="w-7" />
        )}
      </div>
    </header>
  );
}
