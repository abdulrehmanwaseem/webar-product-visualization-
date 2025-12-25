"use client";

import { useEffect, useState } from "react";
import { api, type MerchantOverview, type ItemAnalytics } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<MerchantOverview | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemAnalytics, setItemAnalytics] = useState<ItemAnalytics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await api.analytics.getMerchantOverview();
        setOverview(data);
        if (data.topItems.length > 0) {
          setSelectedItemId(data.topItems[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch overview:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    const fetchItemAnalytics = async () => {
      if (!selectedItemId) return;

      try {
        const data = await api.analytics.getItemAnalytics(selectedItemId);
        setItemAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch item analytics:", error);
      }
    };

    fetchItemAnalytics();
  }, [selectedItemId]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500">Total Items</div>
          <div className="text-3xl font-bold">{overview?.totalItems || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500">Total Scans</div>
          <div className="text-3xl font-bold">{overview?.totalScans || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500">Last 7 Days</div>
          <div className="text-3xl font-bold">{overview?.recentScans || 0}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm text-gray-500">Avg Per Item</div>
          <div className="text-3xl font-bold">
            {overview?.totalItems
              ? Math.round(overview.totalScans / overview.totalItems)
              : 0}
          </div>
        </div>
      </div>

      {overview?.topItems && overview.topItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Items Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold mb-4">Top Items by Scans</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overview.topItems} layout="vertical">
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar
                  dataKey="scans"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => setSelectedItemId(data.id)}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Item Selector & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Selector */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium mb-2">
                Select Item
              </label>
              <select
                value={selectedItemId || ""}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {overview.topItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.scans} scans)
                  </option>
                ))}
              </select>
            </div>

            {/* Daily Scans Chart */}
            {itemAnalytics && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold mb-4">
                  Daily Scans (Last 30 Days)
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={itemAnalytics.dailyScans}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Device Breakdown */}
            {itemAnalytics &&
              Object.keys(itemAnalytics.deviceBreakdown).length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="font-semibold mb-4">Device Breakdown</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(itemAnalytics.deviceBreakdown).map(
                      ([device, count]) => (
                        <div
                          key={device}
                          className="text-center p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm text-gray-500 capitalize">
                            {device}
                          </div>
                          <div className="text-xs text-gray-400">
                            {Math.round(
                              (count / itemAnalytics.totalScans) * 100
                            )}
                            %
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">
            No analytics data yet. Create items and generate scans to see
            analytics.
          </p>
        </div>
      )}
    </div>
  );
}
