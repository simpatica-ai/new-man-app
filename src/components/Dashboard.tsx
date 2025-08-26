// src/components/Dashboard.tsx

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'
import { Button } from './ui/button'
import Link from 'next/link'

type Virtue = {
  id: number;
  name: string;
  description: string;
};

export default function Dashboard({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [virtues, setVirtues] = useState<Virtue[]>([])

  useEffect(() => {
    const getVirtues = async () => {
      try {
        setLoading(true)
        const { data, error, status } = await supabase
          .from('virtues')
          .select(`id, name, description`)
          .order('id')

        if (error && status !== 406) {
          throw error
        }

        if (data) {
          setVirtues(data)
        }
      } catch (error) {
        if (error instanceof Error) {
            alert(error.message)
        }
      } finally {
        setLoading(false)
      }
    }

    getVirtues()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Signed in as: {session.user.email}</p>
        </div>
        <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Choose a Virtue to Practice</h2>
        {loading ? (
          <p>Loading virtues...</p>
        ) : (
          <ul className="space-y-3">
            {/* CORRECTED STRUCTURE BELOW */}
            {virtues.map((virtue) => (
              <li key={virtue.id}>
                <Link 
                  href={`/virtue/${virtue.id}`} 
                  className="block p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className="font-bold text-lg text-brand-header">{virtue.name}</h3>
                  <p className="text-brand-text">{virtue.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}