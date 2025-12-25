import Link from "next/link";

export default function ARNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Item Not Found</h2>
        <p className="text-gray-400 mb-8">
          The AR experience you&apos;re looking for doesn&apos;t exist or has
          been removed.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
