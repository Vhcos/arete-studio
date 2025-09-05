"use client";

import * as React from "react";
import { cn } from "./utils/cn";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = ({ className, ...props }: LabelProps) => (
  <label className={cn("text-sm font-medium text-zinc-700 dark:text-zinc-300", className)} {...props} />
);

