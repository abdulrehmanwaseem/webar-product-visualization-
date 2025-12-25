"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api, type Item, type QrPreview } from "@/lib/api";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QRCodePage({ params }: PageProps) {
  const { id } = use(params);
  const [item, setItem] = useState<Item | null>(null);
  const [qrPreview, setQrPreview] = useState<QrPreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemData, qrData] = await Promise.all([
          api.items.getById(id),
          api.qr.preview(id),
        ]);
        setItem(itemData);
        setQrPreview(qrData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load QR code");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const copyUrl = async () => {
    if (!qrPreview) return;
    await navigator.clipboard.writeText(qrPreview.arUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = (format: "png" | "svg") => {
    const url = api.qr.downloadUrl(id, format, 600);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item?.slug || "qr"}-qr.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !item || !qrPreview) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error || "Failed to load QR code"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/dashboard/items/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">QR Code</h1>
          <p className="text-gray-500">{item.name}</p>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-xl mb-6">
          <img
            src={qrPreview.dataUrl}
            alt={`QR code for ${item.name}`}
            className="w-64 h-64"
          />
        </div>

        {/* URL */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">AR Experience URL</p>
          <div className="flex items-center gap-2 justify-center">
            <code className="px-3 py-2 bg-gray-100 rounded-lg text-sm break-all">
              {qrPreview.arUrl}
            </code>
            <button
              onClick={copyUrl}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Copy URL"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => downloadQr("png")}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
          <button
            onClick={() => downloadQr("svg")}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" />
            Download SVG
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h2 className="font-semibold mb-3">How to use</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Download the QR code in your preferred format</li>
          <li>Print it or display it digitally near your product</li>
          <li>Customers scan the QR code with their phone camera</li>
          <li>The AR experience opens automatically in their browser</li>
        </ol>
      </div>

      {/* AR Support Warning */}
      {!item.usdzUrl && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="font-semibold text-yellow-800 mb-2">iOS AR Limited</h2>
          <p className="text-sm text-yellow-700">
            This item doesn&apos;t have a USDZ file. iOS users will see a 3D
            viewer instead of AR.
            <Link
              href={`/dashboard/items/${id}/edit`}
              className="text-yellow-800 underline ml-1"
            >
              Upload USDZ to enable iOS AR
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
