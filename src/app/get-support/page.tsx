'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { LifeBuoy, CheckCircle } from 'lucide-react';

export default function GetSupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    document.title = "New Man App: Get Support";
  }, []);

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
    <>
      <AppHeader />
      <div className="min-h-screen bg-stone-50">
        <div className="container mx-auto p-4 md:p-6 max-w-4xl">
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="w-full max-w-2xl border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <LifeBuoy className="h-12 w-12 text-amber-600" />
                </div>
                <CardTitle className="text-2xl text-stone-800 font-medium">Get Support</CardTitle>
                <CardDescription className="text-stone-600">
                  Need help with your virtue journey? Our team is here to support you every step of the way.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isSuccess ? (
                  <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-green-800 font-medium mb-4">{formMessage}</p>
                    <Link href="/" className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium">
                      ← Return to Dashboard
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-stone-700 font-medium">Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Issue with my account or virtue progress"
                        required
                        className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-stone-700 font-medium">Message</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please provide as much detail as possible about your question or issue..."
                        required
                        rows={6}
                        className="border-stone-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Support Request'}
                    </Button>
                    <div className="text-center">
                      <Link href="/" className="text-stone-600 hover:text-amber-600 text-sm">
                        Cancel and return to Dashboard
                      </Link>
                    </div>
                  </form>
                )}
                {formMessage && !isSuccess && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-center">{formMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
