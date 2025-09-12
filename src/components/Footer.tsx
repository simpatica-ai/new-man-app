'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-stone-100 border-t border-stone-200 py-4 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <p className="text-sm text-stone-600">
            © {currentYear} Simpatica AI™ (Patent Pending). All rights reserved.
          </p>
          <div className="flex space-x-4 text-sm">
            <Link 
              href="/disclaimer" 
              className="text-stone-600 hover:text-stone-800 underline"
            >
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}