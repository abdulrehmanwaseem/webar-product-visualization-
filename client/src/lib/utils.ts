import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function getDeviceType(): string {
  if (typeof navigator === "undefined") return "unknown";

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua))
    return "desktop";

  return "other";
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/.test(navigator.userAgent.toLowerCase());
}

export function supportsWebXR(): boolean {
  if (typeof navigator === "undefined") return false;
  return "xr" in navigator;
}

export async function checkARSupport(): Promise<{
  webxr: boolean;
  quickLook: boolean;
  sceneViewer: boolean;
}> {
  const result = {
    webxr: false,
    quickLook: false,
    sceneViewer: false,
  };

  if (typeof navigator === "undefined") return result;

  // Check WebXR
  if ("xr" in navigator) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xr = (navigator as any).xr;
      result.webxr = await xr.isSessionSupported("immersive-ar");
    } catch {
      result.webxr = false;
    }
  }

  // iOS Quick Look support (all iOS 12+ Safari)
  result.quickLook = isIOSDevice();

  // Android Scene Viewer (Chrome on Android with ARCore)
  result.sceneViewer = isAndroidDevice();

  return result;
}
