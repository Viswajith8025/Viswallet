"use client";

import { ViewTransition } from "react";

const types = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "nav-tab": "nav-tab",
  default: "nav-tab",
} as const;

/** Remounts with the route so enter/exit run. Layout chrome stays outside. */
export function RouteTransition({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
}) {
  return (
    <ViewTransition enter={types} exit={types} default="none">
      <div key={pathname}>{children}</div>
    </ViewTransition>
  );
}
