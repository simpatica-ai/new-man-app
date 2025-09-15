'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-stone-100 border-t border-stone-200 py-4 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-start space-y-0">
          <p className="text-sm text-stone-600 flex-1 pr-4">
            © {currentYear} Simpatica AI™<br className="xs:hidden" />
            <span className="hidden xs:inline"> </span>(Patent Pending). All rights reserved.
          </p>
          <div className="flex space-x-4 text-sm flex-shrink-0">
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