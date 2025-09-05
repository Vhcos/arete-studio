"use client";

import * as React from "react";
import { cn } from "./utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none",
        "placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
        "dark:bg-zinc-900 dark:border-zinc-700 dark:placeholder:text-zinc-500",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
