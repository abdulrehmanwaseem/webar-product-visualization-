"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Item, type ItemAnalytics } from "@/lib/api";
import {
  ArrowLeft,
  ExternalLink,
  QrCode,
  Trash2,
  BarChart3,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ItemDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [analytics, setAnalytics] = useState<ItemAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemData, analyticsData] = await Promise.all([
          api.items.getById(id),
          api.analytics.getItemAnalytics(id),
        ]);
        setItem(itemData);
        setAnalytics(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this item? This cannot be undone."
      )
    )
      return;

    try {
      await api.items.delete(id);
      router.push("/dashboard/items");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error || "Item not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/items"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <p className="text-gray-500">/{item.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/items/${id}/qr`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <QrCode className="w-4 h-4" />
            QR Code
          </Link>
          <a
            href={`/ar/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </a>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Description</dt>
                <dd>{item.description || "No description"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">3D Model (GLB)</dt>
                <dd className="truncate text-sm text-blue-600">
                  <a
                    href={item.modelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.modelUrl}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">iOS Model (USDZ)</dt>
                <dd>
                  {item.usdzUrl ? (
                    <a
                      href={item.usdzUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 truncate block"
                    >
                      {item.usdzUrl}
                    </a>
                  ) : (
                    <span className="text-yellow-600">
                      Not uploaded - iOS AR disabled
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd>{new Date(item.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {analytics.totalScans}
                  </div>
                  <div className="text-sm text-gray-500">Total Scans</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {analytics.uniqueScans}
                  </div>
                  <div className="text-sm text-gray-500">Unique Scans</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {analytics.avgDuration}s
                  </div>
                  <div className="text-sm text-gray-500">Avg Duration</div>
                </div>
              </div>

              {/* Device Breakdown */}
              {Object.keys(analytics.deviceBreakdown).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Device Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.deviceBreakdown).map(
                      ([device, count]) => (
                        <div key={device} className="flex items-center gap-2">
                          <span className="w-20 text-sm capitalize">
                            {device}
                          </span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${
                                  (count / analytics.totalScans) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Preview</h2>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No thumbnail
                </div>
              )}
            </div>
          </div>

          {/* AR Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-4">AR Support</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Android (Scene Viewer)</span>
                <span className="text-green-600">✓ Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span>iOS (Quick Look)</span>
                <span
                  className={item.usdzUrl ? "text-green-600" : "text-red-600"}
                >
                  {item.usdzUrl ? "✓ Enabled" : "✗ Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Desktop (3D View)</span>
                <span className="text-green-600">✓ Enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
