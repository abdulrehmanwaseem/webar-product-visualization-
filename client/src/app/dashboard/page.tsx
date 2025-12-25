"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type MerchantOverview } from "@/lib/api";
import { Package, Eye, TrendingUp, Plus } from "lucide-react";

export default function DashboardPage() {
  const [overview, setOverview] = useState<MerchantOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await api.analytics.getMerchantOverview();
        setOverview(data);
      } catch (error) {
        console.error("Failed to fetch overview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/dashboard/items/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Item
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold">{overview?.totalItems || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Scans</p>
              <p className="text-2xl font-bold">{overview?.totalScans || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last 7 Days</p>
              <p className="text-2xl font-bold">{overview?.recentScans || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Top Items</h2>
        {overview?.topItems && overview.topItems.length > 0 ? (
          <div className="space-y-3">
            {overview.topItems.map((item, index) => (
              <Link
                key={item.id}
                href={`/dashboard/items/${item.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-gray-500">{item.scans} scans</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No items yet.{" "}
            <Link
              href="/dashboard/items/new"
              className="text-blue-600 hover:underline"
            >
              Create your first item
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
