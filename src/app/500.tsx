export default function Error500() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-light text-stone-800 mb-4">500 - Server Error</h1>
        <p className="text-stone-600 mb-8">Something went wrong on our end.</p>
        <a 
          href="/" 
          className="inline-block bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}