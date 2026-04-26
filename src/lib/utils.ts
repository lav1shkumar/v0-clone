import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TIER_DAILY_LIMITS = {
  FREE: 50,
  PRO: 500,
  ENTERPRISE: 2000,
} as const;

export const TIER_MONTHLY_LIMITS = {
  FREE: 1500,
  PRO: 7500,
  ENTERPRISE: 30000,
} as const;
