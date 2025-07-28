import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-300">404</h1>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Kennel Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the kennel you're looking for. The subdomain
          might be incorrect or the kennel hasn't set up their website yet.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
