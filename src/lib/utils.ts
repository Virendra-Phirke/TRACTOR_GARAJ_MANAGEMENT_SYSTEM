import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getISTDayBounds(date?: Date | string) {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const baseDate = date ? new Date(date) : new Date();
  
  // Shift to IST by adding 5.5 hours to the underlying milliseconds
  const istTime = baseDate.getTime() + IST_OFFSET;
  const shiftedDate = new Date(istTime);
  shiftedDate.setUTCHours(0, 0, 0, 0);
  
  // Shift back to real UTC to get the true start of the IST day
  const startOfDay = new Date(shiftedDate.getTime() - IST_OFFSET);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  
  return { start: startOfDay, end: endOfDay };
}
