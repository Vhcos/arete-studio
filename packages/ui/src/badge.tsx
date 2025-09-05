"use client";

import * as React from "react";
import { cn } from "./utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      variant === "default" && "bg-blue-600 text-white",
      variant === "outline" && "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
      className
    )}
    {...props}
  />
);
