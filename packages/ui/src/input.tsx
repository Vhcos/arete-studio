"use client";

import * as React from "react";
import { cn } from "./utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none",
        "placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
        "dark:bg-zinc-900 dark:border-zinc-700 dark:placeholder:text-zinc-500",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
