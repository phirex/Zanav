import Link from "next/link";

export default function KennelTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🎉 Kennel Website Test
        </h1>
        <p className="text-gray-600 mb-8">
          The kennel website system is working! You can now access your kennel's
          public website.
        </p>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">
              Your Kennel Website
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Access your kennel's public website at:
            </p>
            <code className="block bg-gray-100 px-3 py-2 rounded text-sm">
              /kennel/kennel-deba3d57
            </code>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">
              ✅ What's Working
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Hero section with title and tagline</li>
              <li>• Cover photo display</li>
              <li>• Gallery images (2 uploaded)</li>
              <li>• Contact information</li>
              <li>• Google Maps integration</li>
              <li>• Responsive design</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              🚀 Ready to Add
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Videos section</li>
              <li>• Customer testimonials</li>
              <li>• FAQ section</li>
              <li>• Direct booking functionality</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 space-x-4">
          <Link
            href="/kennel/kennel-deba3d57"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Your Website
          </Link>

          <Link
            href="/settings/website"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Edit Website
          </Link>
        </div>
      </div>
    </div>
  );
}
