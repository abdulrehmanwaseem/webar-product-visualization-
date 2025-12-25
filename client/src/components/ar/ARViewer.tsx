"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { api, type Item } from "@/lib/api";
import {
  generateSessionId,
  getDeviceType,
  isIOSDevice,
  isAndroidDevice,
} from "@/lib/utils";

interface ARViewerProps {
  item: Item;
}

type ARStatus =
  | "not-presenting"
  | "session-started"
  | "object-placed"
  | "failed";

export default function ARViewer({ item }: ARViewerProps) {
  const modelViewerRef = useRef<HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [arStatus, setArStatus] = useState<ARStatus>("not-presenting");
  const [showInstructions, setShowInstructions] = useState(false);
  const [modelViewerLoaded, setModelViewerLoaded] = useState(false);
  const [showArHint, setShowArHint] = useState(true);

  const sessionIdRef = useRef<string>(generateSessionId());
  const scanEventIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Determine device type for analytics and messaging
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();
  const isMobile = isIOS || isAndroid;
  const hasUsdzFile = !!item.usdzUrl;

  // Always enable AR - let model-viewer handle device capability checking
  // It will show/hide the AR button automatically based on device support

  // Hide AR hint after 5 seconds
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowArHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Debug logging for AR support
  useEffect(() => {
    console.log("AR Debug Info:", {
      isIOS,
      isAndroid,
      hasUsdzFile,
      modelUrl: item.modelUrl,
      usdzUrl: item.usdzUrl,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "N/A",
    });

    // Test if model URL is accessible
    fetch(item.modelUrl, { method: "HEAD" })
      .then((res) => console.log("Model URL accessible:", res.ok, res.status))
      .catch((err) => console.error("Model URL fetch error:", err));
  }, [isIOS, isAndroid, hasUsdzFile, item.modelUrl, item.usdzUrl]);

  // Record scan on mount
  useEffect(() => {
    const recordScan = async () => {
      try {
        const result = await api.analytics.recordScan({
          itemId: item.id,
          deviceType: getDeviceType(),
          sessionId: sessionIdRef.current,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        });
        scanEventIdRef.current = result.id;
        startTimeRef.current = Date.now();
      } catch (err) {
        console.error("Failed to record scan:", err);
      }
    };

    recordScan();

    // Update duration on unmount
    return () => {
      if (scanEventIdRef.current) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        api.analytics
          .updateDuration(scanEventIdRef.current, duration)
          .catch(console.error);
      }
    };
  }, [item.id]);

  // Periodically update duration
  useEffect(() => {
    const interval = setInterval(() => {
      if (scanEventIdRef.current) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        api.analytics
          .updateDuration(scanEventIdRef.current, duration)
          .catch(console.error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setLoadProgress(100);
  }, []);

  const handleError = useCallback((event: Event) => {
    console.error("Model loading error:", event);
    setError("Failed to load 3D model. Please try again.");
    setIsLoading(false);
  }, []);

  const handleProgress = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ totalProgress: number }>;
    setLoadProgress(Math.round(customEvent.detail.totalProgress * 100));
  }, []);

  const handleARStatus = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ status: string }>;
    const status = customEvent.detail.status as ARStatus;
    console.log("AR Status changed:", status);
    setArStatus(status);

    if (status === "session-started") {
      setShowInstructions(true);
    } else if (status === "object-placed") {
      setShowInstructions(false);
    } else if (status === "failed") {
      setShowInstructions(false);
      setError(
        "AR failed to start. Make sure your device supports AR and the model is accessible."
      );
    }
  }, []);

  // Attach event listeners
  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer || !modelViewerLoaded) return;

    modelViewer.addEventListener("load", handleLoad);
    modelViewer.addEventListener("error", handleError);
    modelViewer.addEventListener("progress", handleProgress);
    modelViewer.addEventListener("ar-status", handleARStatus);

    return () => {
      modelViewer.removeEventListener("load", handleLoad);
      modelViewer.removeEventListener("error", handleError);
      modelViewer.removeEventListener("progress", handleProgress);
      modelViewer.removeEventListener("ar-status", handleARStatus);
    };
  }, [
    modelViewerLoaded,
    handleLoad,
    handleError,
    handleProgress,
    handleARStatus,
  ]);

  return (
    <>
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        type="module"
        onLoad={() => setModelViewerLoaded(true)}
        onError={() => setError("Failed to load AR viewer")}
      />

      <div className="ar-container">
        {/* Loading overlay */}
        {isLoading && (
          <div className="ar-loading">
            <div className="ar-loading-spinner" />
            <p className="mt-4 text-sm">Loading 3D model... {loadProgress}%</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="ar-loading">
            <div className="text-red-400 text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-white text-black rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* AR Instructions */}
        {showInstructions && (
          <div className="ar-instruction">
            Move your phone to detect a surface, then tap to place
          </div>
        )}

        {/* AR Error message - shown when AR fails */}
        {arStatus === "failed" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 text-black p-4 rounded-2xl text-center shadow-lg z-20 animate-in fade-in duration-300">
            AR is not supported on this device
          </div>
        )}

        {/* Model Viewer - AR button always shown, model-viewer handles device support */}
        {modelViewerLoaded && (
          <model-viewer
            ref={modelViewerRef}
            src={item.modelUrl}
            ios-src={item.usdzUrl || undefined}
            poster={item.thumbnailUrl}
            alt={item.name}
            ar=""
            ar-modes="scene-viewer webxr quick-look"
            camera-controls=""
            touch-action="pan-y"
            shadow-intensity="1"
            auto-rotate=""
            environment-image="neutral"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#1a1a1a",
            }}
          />
        )}

        {/* Floating AR hint for mobile - shows briefly when loaded */}
        {!isLoading && arStatus === "not-presenting" && showArHint && (
          <div className="absolute bottom-20 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-20 flex items-center gap-2">
            <span>View in AR</span>
            <span className="animate-bounce">↓</span>
          </div>
        )}

        {/* Desktop notice */}
        {!isMobile && !isLoading && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-20 text-center max-w-xs">
            📱 Open this page on your phone to experience AR
          </div>
        )}

        {/* Item info overlay */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg max-w-[80%]">
          <h1 className="font-semibold text-lg">{item.name}</h1>
          {item.description && (
            <p className="text-sm text-gray-300 mt-1">{item.description}</p>
          )}
        </div>
      </div>
    </>
  );
}
