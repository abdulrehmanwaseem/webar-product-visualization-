"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Item } from "@/lib/api";
import { Plus, ExternalLink, Trash2, QrCode } from "lucide-react";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await api.items.list();
        setItems(data.items);
      } catch (error) {
        console.error("Failed to fetch items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await api.items.delete(id);
      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item");
    }
  };

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
        <h1 className="text-2xl font-bold">Items</h1>
        <Link
          href="/dashboard/items/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Item
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No items yet</h2>
          <p className="text-gray-500 mb-6">
            Create your first item to start generating QR codes for AR
            experiences.
          </p>
          <Link
            href="/dashboard/items/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Create Item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-100 relative">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-gray-500 mb-3 truncate">
                  {item.description || "No description"}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <span>{item.totalScans || 0} scans</span>
                  <span>•</span>
                  <span>
                    {item.usdzUrl ? "iOS AR enabled" : "Android AR only"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/items/${item.id}`}
                    className="flex-1 px-3 py-2 text-center bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/items/${item.id}/qr`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="QR Code"
                  >
                    <QrCode className="w-5 h-5" />
                  </Link>
                  <a
                    href={`/ar/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="Preview AR"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Package({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}
