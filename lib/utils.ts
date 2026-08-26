import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Reads a single related row from a Supabase join. Without generated database
 * types, PostgREST relations are inferred as arrays even for to-one joins,
 * so this accepts both shapes safely.
 */
export function joinedRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}
