'use client'

import Link from 'next/link'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { UserCheck, BookOpen, Edit, Sparkles } from 'lucide-react'
import VirtueRoseChart from '../VirtueRoseChart'
import { Virtue, Connection, getChartDisplayVirtueName } from '@/lib/constants'

interface ActionCardsProps {
  assessmentTaken: boolean;
  virtues: Virtue[];
  connection: Connection | null;
  lastJournalEntry: string | null;
}

export default function ActionCards({ 
  assessmentTaken, 
  virtues, 
  connection, 
  lastJournalEntry 
}: ActionCardsProps) {
  const calculateDaysSince = (dateString: string | null): number | null => {
    if (!dateString) return null;
    const lastDate = new Date(dateString);
    const today = new Date();
    lastDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const differenceInTime = today.getTime() - lastDate.getTime();
    return Math.floor(differenceInTime / (1000 * 3600 * 24));
  };

  const daysSinceJournal = calculateDaysSince(lastJournalEntry);

  return (
    <div className="space-y-6">
      <Card className="order-first bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <BookOpen className="h-8 w-8 text-amber-700" />
          <div>
            <CardTitle className="text-stone-800 font-medium">Assessment</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {assessmentTaken && virtues.length > 0 ? (
            <>
              <div className="p-2">
                <VirtueRoseChart 
                  data={virtues.map(v => ({
                    virtue: getChartDisplayVirtueName(v.name),
                    score: v.virtue_score || 0
                  }))}
                  size="thumbnail"
                  showLabels={false}
                />
              </div>
              <div className="px-6 pb-4 pt-0 text-center">
                <Link 
                  href="/assessment" 
                  className="text-amber-700 hover:text-amber-800 underline text-sm"
                >
                  View Full Assessment
                </Link>
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3 text-amber-700">
                <Sparkles size={18} />
                <p className="text-sm font-medium">Discover your Virtue Rose</p>
              </div>
              <p className="text-sm text-stone-600 mb-3">
                Take the assessment to visualize your virtue strengths and areas for growth.
              </p>
              <Link href="/assessment">
                <Button size="sm" variant="outline">Take Assessment</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <UserCheck className="h-8 w-8 text-amber-700" />
          <div>
            <CardTitle className="text-stone-800 font-medium">Sponsor Connection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div>
              <p className="text-sm text-stone-600">Connected with:</p>
              <p className="font-semibold text-stone-800">
                {connection.sponsor_name || 'Your Sponsor'}
              </p>
              <p className={`text-sm font-medium capitalize ${
                connection.status === 'active' ? 'text-green-600' : 'text-amber-600'
              }`}>
                {connection.status}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-stone-600 mb-2">
                You have not connected with a sponsor yet.
              </p>
              <Link href="/account-settings">
                <Button size="sm" variant="outline">Invite a Sponsor</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <Edit className="h-8 w-8 text-amber-700" />
          <div>
            <CardTitle className="text-stone-800 font-medium">Journal</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {daysSinceJournal !== null ? (
            <p className="text-sm text-stone-600 mb-2">
              Your last entry was <span className="font-bold text-stone-800">
                {daysSinceJournal === 0 ? 'today' : `${daysSinceJournal} day${daysSinceJournal > 1 ? 's' : ''} ago`}
              </span>.
            </p>
          ) : (
            <p className="text-sm text-stone-600 mb-2">
              Start your journey with your first journal entry.
            </p>
          )}
          <Link href="/journal">
            <Button size="sm" variant="outline">Go to Journal</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
