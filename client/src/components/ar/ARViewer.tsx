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

  const sessionIdRef = useRef<string>(generateSessionId());
  const scanEventIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

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
    setArStatus(status);

    if (status === "session-started") {
      setShowInstructions(true);
    } else if (status === "object-placed" || status === "failed") {
      setShowInstructions(false);
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

  // Determine AR configuration based on device and available assets
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();
  const hasUsdzFile = !!item.usdzUrl;

  // AR is available if: Android (always with GLB) OR iOS with USDZ
  const arEnabled = isAndroid || (isIOS && hasUsdzFile);

  // Build ar-modes string
  const arModes = [
    isAndroid ? "scene-viewer" : null,
    isIOS && hasUsdzFile ? "quick-look" : null,
    "webxr",
  ]
    .filter(Boolean)
    .join(" ");

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

        {/* iOS AR not available message */}
        {isIOS && !hasUsdzFile && !isLoading && (
          <div className="absolute top-4 left-4 right-4 bg-yellow-500/90 text-black p-3 rounded-lg text-sm z-20">
            <strong>AR not available on iOS.</strong> This item requires a USDZ
            file for iOS AR. You can still view the 3D model below.
          </div>
        )}

        {/* Model Viewer */}
        {modelViewerLoaded && (
          <model-viewer
            ref={modelViewerRef}
            src={item.modelUrl}
            ios-src={hasUsdzFile ? item.usdzUrl : undefined}
            poster={item.thumbnailUrl}
            alt={item.name}
            ar={arEnabled ? "" : undefined}
            ar-modes={arEnabled ? arModes : undefined}
            ar-scale="auto"
            ar-placement="floor"
            camera-controls=""
            touch-action="pan-y"
            auto-rotate=""
            auto-rotate-delay={3000}
            interaction-prompt="auto"
            shadow-intensity="1"
            shadow-softness="1"
            exposure="1"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#1a1a1a",
            }}
          >
            {/* AR button slot */}
            <button
              slot="ar-button"
              className="absolute bottom-4 right-4 px-6 py-3 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!arEnabled}
            >
              {arEnabled ? "View in AR" : "3D View Only"}
            </button>

            {/* Progress bar slot */}
            <div
              slot="progress-bar"
              className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800"
            >
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </model-viewer>
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
