import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidHttpUrl(value?: string) {
  let url;

  if (!value) return false;
  
  try {
    url = new URL(value);
  } catch (_) {
    void _;
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

export function decodeJWT<T>(token: string): T {
  const payloadBase64 = token.split('.')[1];
  const decodedPayload = atob(payloadBase64);
  return JSON.parse(decodedPayload);
}
