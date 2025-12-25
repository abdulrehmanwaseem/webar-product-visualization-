import { notFound } from "next/navigation";
import ARViewer from "@/components/ar/ARViewer";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getItem(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  try {
    const response = await fetch(`${apiUrl}/items/slug/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch item:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItem(slug);

  if (!item) {
    return {
      title: "Item Not Found",
    };
  }

  return {
    title: `${item.name} - View in AR`,
    description: item.description || `View ${item.name} in augmented reality`,
    openGraph: {
      title: `${item.name} - View in AR`,
      description: item.description || `View ${item.name} in augmented reality`,
      images: item.thumbnailUrl ? [item.thumbnailUrl] : [],
    },
  };
}

export default async function ARPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await getItem(slug);

  if (!item) {
    notFound();
  }

  return <ARViewer item={item} />;
}
