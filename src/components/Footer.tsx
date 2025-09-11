'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-stone-100 border-t border-stone-200 py-4 mt-8">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-stone-600">
          © {currentYear} Simpatica AI™ (Patent Pending). All rights reserved.
        </p>
      </div>
    </footer>
  );
}