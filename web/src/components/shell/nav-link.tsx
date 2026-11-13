"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { transitionFor } from "@/lib/navigation/app-nav";

type Props = ComponentProps<typeof Link> & {
  /** Override the automatic tab-versus-drill motion. */
  motion?: "nav-tab" | "nav-forward";
};

export function NavLink({ href, motion, ...props }: Props) {
  const path = typeof href === "string" ? href : href.pathname ?? "/";
  return <Link href={href} transitionTypes={[motion ?? transitionFor(path)]} {...props} />;
}
