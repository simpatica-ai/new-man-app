'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PublicHeader() {
  const pathname = usePathname();
  const isOrganizationsPage = pathname.startsWith('/organizations');

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200/60 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold text-stone-800">
            New Man App
          </Link>
          <div className="flex items-center space-x-4">
            {isOrganizationsPage ? (
              <Link href="/">
                <Button variant="ghost" className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-medium">
                  For Individuals
                </Button>
              </Link>
            ) : (
              <Link href="/organizations">
                <Button variant="ghost" className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-medium">
                  For Organizations
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}