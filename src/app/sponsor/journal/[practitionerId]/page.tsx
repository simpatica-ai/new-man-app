'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
// ## FIX: Removed unused 'AlertDescription' import
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Send, AlertCircle } from 'lucide-react';
import DOMPurify from 'dompurify';

// --- Type Definitions ---
type PractitionerProfile = {
  id: string;
  full_name: string | null;
};

type SharedMemo = {
  virtue_id: number;
  stage_number: number;
  memo_text: string | null;
  practitioner_updated_at: string;
  sponsor_read_at: string | null;
};

type Virtue = {
  id: number;
  name: string;
};

type ChatMessage = { 
  id: number; 
  sender_id: string; 
  message_text: string; 
  created_at: string; 
  sender_name: string | null 
};

type SelectedMemo = SharedMemo & { virtue_name: string };

export default function SponsorJournalView() {
  const [loading, setLoading] = useState(true);
  const [practitioner, setPractitioner] = useState<PractitionerProfile | null>(null);
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [sharedMemos, setSharedMemos] = useState<SharedMemo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<SelectedMemo | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  const params = useParams();
  const router = useRouter();
  const practitionerId = params.practitionerId as string;

  const fetchData = useCallback(async () => {
    if (!practitionerId) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setCurrentUserId(user.id);

      const practitionerPromise = supabase.from('profiles').select('id, full_name').eq('id', practitionerId).single();
      const virtuesPromise = supabase.from('virtues').select('id, name').order('id');
      const memosPromise = supabase.from('sponsor_visible_memos').select('*').eq('user_id', practitionerId);
      const assessmentPromise = supabase.from('user_assessment_results').select('virtue_name, priority_score').eq('user_id', practitionerId).order('assessment_id', { ascending: false });
      const connectionPromise = supabase.from('sponsor_connections').select('id').eq('practitioner_user_id', practitionerId).eq('sponsor_user_id', user.id).eq('status', 'active').single();

      const [practitionerResult, virtuesResult, memosResult, assessmentResult, connectionResult] = await Promise.all([
        practitionerPromise, virtuesPromise, memosPromise, assessmentPromise, connectionPromise
      ]);

      if (practitionerResult.error) throw practitionerResult.error;
      setPractitioner(practitionerResult.data);

      if (virtuesResult.error) throw virtuesResult.error;
      const baseVirtues = virtuesResult.data || [];

      if (memosResult.error) throw memosResult.error;
      setSharedMemos(memosResult.data || []);
      
      if (assessmentResult.error) throw assessmentResult.error;
      const assessmentData = assessmentResult.data || [];

      if (assessmentData.length > 0) {
        const scoreMap = new Map(assessmentData.map(r => [r.virtue_name, r.priority_score]));
        const sortedVirtues = [...baseVirtues].sort((a, b) => (scoreMap.get(b.name) || 0) - (scoreMap.get(a.name) || 0));
        setVirtues(sortedVirtues);
      } else {
        setVirtues(baseVirtues);
      }

      if (connectionResult.error) throw connectionResult.error;
      if (connectionResult.data) {
        const connId = connectionResult.data.id;
        setConnectionId(connId);

        const { data: rawMessages, error: messagesError } = await supabase.from('sponsor_chat_messages').select('id, sender_id, message_text, created_at, read_at').eq('connection_id', connId).order('created_at', { ascending: true });
        if (messagesError) throw messagesError;

        if (rawMessages && rawMessages.length > 0) {
          const senderIds = [...new Set(rawMessages.map(msg => msg.sender_id))];
          const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, full_name').in('id', senderIds);
          if (profilesError) throw profilesError;

          const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));
          const combinedMessages = rawMessages.map(msg => ({ ...msg, sender_name: profileMap.get(msg.sender_id) || 'Unknown User' }));
          setChatMessages(combinedMessages);
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching sponsor data:", error);
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [practitionerId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectMemo = (virtue: Virtue, stageNumber: number) => {
    const memo = sharedMemos.find(m => m.virtue_id === virtue.id && m.stage_number === stageNumber);
    if (memo) {
      setSelectedMemo({ ...memo, virtue_name: virtue.name });
      if (!memo.sponsor_read_at) {
        markMemoAsRead(memo);
      }
    } else {
        setSelectedMemo(null);
    }
  };

  const markMemoAsRead = async (memo: SharedMemo) => {
    const { error } = await supabase
      .from('sponsor_visible_memos')
      .update({ sponsor_read_at: new Date().toISOString() })
      .eq('user_id', practitionerId)
      .eq('virtue_id', memo.virtue_id)
      .eq('stage_number', memo.stage_number);

    if (error) {
        console.error("Error marking memo as read:", error);
    } else {
        setSharedMemos(memos => memos.map(m => 
            (m.virtue_id === memo.virtue_id && m.stage_number === memo.stage_number)
            ? { ...m, sponsor_read_at: new Date().toISOString() } 
            : m
        ));
    }
  };

  const getButtonStatusClass = (virtueId: number, stageNumber: number) => {
    const memo = sharedMemos.find(m => m.virtue_id === virtueId && m.stage_number === stageNumber);
    if (!memo) return 'bg-gray-200 hover:bg-gray-300 text-gray-500';
    
    // ## FIX: Removed unused 'hasBeenRead' variable
    const practitionerUpdated = new Date(memo.practitioner_updated_at);
    const sponsorRead = memo.sponsor_read_at ? new Date(memo.sponsor_read_at) : null;

    if (!sponsorRead || practitionerUpdated > sponsorRead) {
      return 'bg-green-500 hover:bg-green-600 text-white animate-pulse';
    }
    return 'bg-blue-500 hover:bg-blue-600 text-white';
  };

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !currentUserId || !connectionId || !practitioner) return;

    const { data: newMessage, error } = await supabase
      .from('sponsor_chat_messages')
      .insert({ connection_id: connectionId, sender_id: currentUserId, receiver_id: practitioner.id, message_text: newChatMessage })
      .select('id, sender_id, message_text, created_at, read_at')
      .single();

    if (error) {
      alert("Error sending message: " + error.message);
    } else {
      if (newMessage) {
        const { data: { user } } = await supabase.auth.getUser();
        const senderName = user?.user_metadata.full_name || 'You';
        setChatMessages([...chatMessages, { ...newMessage, sender_name: senderName }]);
      }
      setNewChatMessage("");
    }
  };
  
  // ## FIX: Replaced ' with &apos;
  if (loading) return <div className="p-8 text-center">Loading practitioner&apos;s journal...</div>;
  if (!practitioner) return <div className="p-8 text-center">Practitioner not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link href="/" className="mb-4 inline-block">
          <Button variant="outline">&larr; Back to Sponsor Hub</Button>
        </Link>
        {/* ## FIX: Replaced ' with &apos; */}
        <h1 className="text-4xl font-bold text-gray-800">Viewing Journal for {practitioner.full_name || 'Practitioner'}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel: Virtue List */}
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center bg-gray-100">
                    <CardTitle className="flex-1">Virtue</CardTitle>
                    <div className="flex-1 grid grid-cols-3 text-center gap-2">
                        <span className="font-semibold text-sm">Stage 1</span>
                        <span className="font-semibold text-sm">Stage 2</span>
                        <span className="font-semibold text-sm">Stage 3</span>
                    </div>
                </CardHeader>
                <CardContent className="p-2 space-y-2">
                    {virtues.map(virtue => (
                        <div key={virtue.id} className="flex items-center p-2 border rounded-md">
                            <h3 className="font-semibold flex-1">{virtue.name}</h3>
                            <div className="flex-1 grid grid-cols-3 gap-2">
                                {[1,2,3].map(stageNum => (
                                    <Button key={stageNum} size="sm" className={getButtonStatusClass(virtue.id, stageNum)} onClick={() => handleSelectMemo(virtue, stageNum)}>
                                        View
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        {/* Right Panel: Content Viewer and Chat */}
        <div className="space-y-8">
            <Card className="min-h-[400px]">
                <CardHeader>
                    <CardTitle>{selectedMemo ? `${selectedMemo.virtue_name} - Stage ${selectedMemo.stage_number}` : 'Select a Memo'}</CardTitle>
                    <CardDescription>{selectedMemo ? `Last updated: ${new Date(selectedMemo.practitioner_updated_at).toLocaleString()}` : 'Click a "View" button to display a shared memo.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedMemo ? (
                        <div 
                          className="prose max-w-none p-4 border rounded-md bg-white" 
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMemo.memo_text || '<em>No content shared.</em>') }} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-gray-500">No memo selected.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Chat with {practitioner.full_name || 'Practitioner'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 border p-4 rounded-md bg-gray-100 flex flex-col">
                        {chatMessages.length > 0 ? chatMessages.map(message => (
                        <div key={message.id} className={`p-3 rounded-lg shadow-sm flex flex-col ${ message.sender_id === currentUserId ? 'bg-blue-500 text-white self-end' : 'bg-white text-gray-800 self-start' } max-w-[70%]`}>
                            <p className={`text-xs mb-1 ${ message.sender_id === currentUserId ? 'text-blue-200' : 'text-gray-500' }`}>
                            <strong>{message.sender_name || 'Unknown'}</strong> - {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                            <p className="whitespace-pre-wrap">{message.message_text}</p>
                        </div>
                        )) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No Messages Yet</AlertTitle>
                        </Alert>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Textarea className="flex-grow bg-white" placeholder="Type your message..." value={newChatMessage} onChange={(e) => setNewChatMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); }}} />
                        <Button onClick={handleSendChatMessage} size="icon" className="flex-shrink-0"><Send size={18} /></Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
