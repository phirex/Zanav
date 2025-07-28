import Link from "next/link";

export default function KennelDirectoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect Kennel
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Discover professional dog boarding services in your area
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How to Access Kennel Websites
            </h2>
            <p className="text-lg text-gray-600">
              Each kennel has their own unique website. You can access them
              using their subdomain.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4">Example Kennel URLs</h3>
            <div className="space-y-2 text-gray-600">
              <p>
                •{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  kennel-deba3d57.yourdomain.com
                </code>
              </p>
              <p>
                •{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  your-kennel-name.yourdomain.com
                </code>
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              For Kennel Owners
            </h3>
            <p className="text-blue-800 mb-4">
              Want to create your own kennel website? Sign up for our kennel
              management platform and get your own custom website.
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>&copy; 2025 Kennel Website Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
