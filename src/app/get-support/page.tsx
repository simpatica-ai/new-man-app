'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function GetSupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormMessage(null);
    setIsSuccess(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFormMessage('You must be logged in to submit a ticket.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: subject,
        message: message,
      });

    if (error) {
      setFormMessage(`Error: ${error.message}`);
    } else {
      setFormMessage('Your support ticket has been submitted successfully!');
      setIsSuccess(true);
      setSubject('');
      setMessage('');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Submit a Support Ticket</CardTitle>
          <CardDescription>
            Please describe your issue below, and our team will get back to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
             <div className="text-center p-4 bg-green-100 text-green-800 rounded-md">
                <p>{formMessage}</p>
                <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
                    &larr; Back to Dashboard
                </Link>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Issue with my account"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide as much detail as possible..."
                  required
                  rows={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </Button>
               <div className="text-center text-sm">
                  <Link href="/" className="text-blue-600 hover:underline">
                    Cancel and return to Dashboard
                  </Link>
              </div>
            </form>
          )}
           {formMessage && !isSuccess && (
            <p className="text-red-500 text-center mt-4">{formMessage}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
