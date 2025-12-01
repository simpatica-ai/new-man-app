'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Send, AlertCircle, MessageCircle, BookOpen, Bell, BarChart3 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import VirtueRoseChart from '@/components/VirtueRoseChart';
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

export default function SponsorView() {
  const [loading, setLoading] = useState(true);
  const [practitioner, setPractitioner] = useState<PractitionerProfile | null>(null);
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [sharedMemos, setSharedMemos] = useState<SharedMemo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<SelectedMemo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [connectionId, setConnectionId] = useState<number | string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [assessmentData, setAssessmentData] = useState<{virtue_name: string; priority_score: number}[]>([]);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [lastActivity, setLastActivity] = useState<string | null>(null);

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
      // Query assessment results directly instead of through join (RLS may be blocking the join)
      const assessmentPromise = supabase
        .from('user_assessment_results')
        .select('virtue_name, priority_score, defect_intensity')
        .eq('user_id', practitionerId)
        .order('created_at', { ascending: false })
        .limit(12);
      // Query virtue stage progress to show which stages are completed
      const progressPromise = supabase
        .from('user_virtue_stage_progress')
        .select('virtue_id, stage_number, status')
        .eq('user_id', practitionerId);
      // Use sponsor_relationships instead of sponsor_connections since that's where the data is
      const connectionPromise = supabase.from('sponsor_relationships').select('id').eq('practitioner_id', practitionerId).eq('sponsor_id', user.id).eq('status', 'active').single();
      const activityPromise = supabase.from('user_virtue_stage_memos').select('created_at').eq('user_id', practitionerId).order('created_at', { ascending: false }).limit(1);

      const [practitionerResult, virtuesResult, memosResult, assessmentResult, progressResult, connectionResult, activityResult] = await Promise.all([
        practitionerPromise, virtuesPromise, memosPromise, assessmentPromise, progressPromise, connectionPromise, activityPromise
      ]);

      if (practitionerResult.error) throw practitionerResult.error;
      setPractitioner(practitionerResult.data);
      console.log('✅ Practitioner loaded:', practitionerResult.data);
      
      // Set last activity from memo updates
      if (activityResult.data && activityResult.data.length > 0) {
        setLastActivity(activityResult.data[0].created_at);
      }

      if (virtuesResult.error) throw virtuesResult.error;
      const baseVirtues = virtuesResult.data || [];
      console.log('✅ Virtues loaded:', baseVirtues.length);

      if (memosResult.error) throw memosResult.error;
      const memos = memosResult.data || [];
      setSharedMemos(memos);
      console.log('✅ Memos loaded:', memos.length);
      
      // Count unread memos
      const unread = memos.filter(m => !m.sponsor_read_at || new Date(m.practitioner_updated_at) > new Date(m.sponsor_read_at)).length;
      setUnreadCount(unread);
      
      // Process virtue stage progress
      if (progressResult.error) {
        console.error('❌ Progress error:', progressResult.error);
      } else if (progressResult.data) {
        console.log('✅ Progress loaded:', progressResult.data.length);
        // Build progress map like the personal dashboard does
        const progressMap = new Map();
        progressResult.data.forEach((p: {virtue_id: number; stage_number: number; status: string}) => {
          progressMap.set(`${p.virtue_id}-${p.stage_number}`, p.status);
        });
        // Store progress in state (need to add this state variable)
        console.log('📊 Progress map:', progressMap);
      }
      
      if (assessmentResult.error) {
        console.error('❌ Assessment error:', assessmentResult.error);
        throw assessmentResult.error;
      }
      
      console.log('📋 Raw assessment query result:', assessmentResult.data);
      
      // Direct query returns array of results (no join)
      const assessmentResults = assessmentResult.data || [];
      
      console.log('✅ Assessment results loaded:', assessmentResults.length, assessmentResults);
      setAssessmentData(assessmentResults);
      setHasAssessment(assessmentResults.length > 0);

      if (assessmentResults.length > 0) {
        const scoreMap = new Map(assessmentResults.map(r => [r.virtue_name, r.priority_score]));
        const sortedVirtues = [...baseVirtues].sort((a, b) => (scoreMap.get(b.name) || 0) - (scoreMap.get(a.name) || 0));
        setVirtues(sortedVirtues);
      } else {
        setVirtues(baseVirtues);
      }

      // Connection is optional - if it doesn't exist, chat won't work but other features will
      if (!connectionResult.error && connectionResult.data) {
        const connId = connectionResult.data.id;
        setConnectionId(connId);

        // Only try to load chat messages if we have a numeric connection ID
        // (sponsor_chat_messages requires sponsor_connections.id which is numeric)
        if (typeof connId === 'number') {
          const { data: rawMessages, error: messagesError } = await supabase.from('sponsor_chat_messages').select('id, sender_id, message_text, created_at, read_at').eq('connection_id', connId).order('created_at', { ascending: true });
          
          if (!messagesError && rawMessages && rawMessages.length > 0) {
            const senderIds = [...new Set(rawMessages.map(msg => msg.sender_id))];
            const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, full_name').in('id', senderIds);
            
            if (!profilesError && profiles) {
              const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));
              const combinedMessages = rawMessages.map(msg => ({ ...msg, sender_name: profileMap.get(msg.sender_id) || 'Unknown User' }));
              setChatMessages(combinedMessages);
            }
          } else if (messagesError) {
            console.log('Chat messages not available:', messagesError.message);
          }
        } else {
          console.log('Chat not available: connection ID is not numeric (using sponsor_relationships instead of sponsor_connections)');
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
        setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getButtonStatusClass = (virtueId: number, stageNumber: number) => {
    const memo = sharedMemos.find(m => m.virtue_id === virtueId && m.stage_number === stageNumber);
    if (!memo) return 'bg-stone-200 hover:bg-stone-300 text-stone-500 cursor-not-allowed';
    
    const practitionerUpdated = new Date(memo.practitioner_updated_at);
    const sponsorRead = memo.sponsor_read_at ? new Date(memo.sponsor_read_at) : null;

    if (!sponsorRead || practitionerUpdated > sponsorRead) {
      return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md animate-pulse';
    }
    return 'bg-gradient-to-r from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700 text-white';
  };

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !currentUserId || !connectionId || !practitioner) return;
    
    // Chat only works with numeric connection IDs from sponsor_connections table
    if (typeof connectionId !== 'number') {
      alert("Chat is not available. Please contact support to enable this feature.");
      return;
    }

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
  
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      <div className="relative z-10">
        <AppHeader />
        <div className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-300/60 rounded-lg w-64 mx-auto"></div>
            <div className="h-4 bg-amber-200/60 rounded-lg w-48 mx-auto"></div>
          </div>
          <p className="text-stone-600 font-light mt-4">Loading practitioner&apos;s workspace...</p>
        </div>
      </div>
    </div>
  );
  
  if (!practitioner) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="relative z-10">
        <AppHeader />
        <div className="p-8 text-center">
          <p className="text-stone-600 font-light">Practitioner not found.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/60 to-stone-100/80"></div>
      
      <div className="relative z-10">
        <AppHeader />
        <main className="container mx-auto p-4 md:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-stone-800 leading-tight">
                  Sponsoring {practitioner.full_name || 'Practitioner'}
                  <span className="block text-xl font-medium text-amber-900 mt-1">Virtue Progress Review</span>
                </h1>
                <div className="w-24 h-0.5 bg-gradient-to-r from-amber-600 to-stone-600 mt-3"></div>
              </div>
              <div className="flex items-center gap-3">
                {lastActivity && (
                  <div className="text-sm text-stone-600">
                    Last active: <span className="font-medium">
                      {(() => {
                        const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
                        if (days === 0) return 'Today';
                        if (days === 1) return 'Yesterday';
                        if (days <= 7) return `${days} days ago`;
                        return new Date(lastActivity).toLocaleDateString();
                      })()} 
                    </span>
                  </div>
                )}
                {unreadCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    <Bell className="h-3 w-3 mr-1" />
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel: Assessment & Virtue List */}
            <div className="space-y-6">
                {/* Assessment Results */}
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <BarChart3 className="h-6 w-6 text-amber-700" />
                        <div className="flex-1">
                            <CardTitle className="text-stone-800 font-medium">Assessment Results</CardTitle>
                            <CardDescription className="text-stone-600">Virtue priority analysis</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {hasAssessment ? (
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <VirtueRoseChart 
                                        data={virtues.map(v => {
                                            const assessment = assessmentData.find(a => a.virtue_name === v.name);
                                            const defectCount = 5; // Placeholder - would need actual defect mapping
                                            const maxScore = defectCount * 25;
                                            const score = assessment ? Math.max(0, 10 - (assessment.priority_score / maxScore) * 10) : 5;
                                            return { virtue: v.name, score };
                                        })}
                                        size="medium"
                                        showLabels={true}
                                    />
                                </div>
                                <p className="text-sm text-stone-600 text-center bg-stone-50/60 p-3 rounded-lg">
                                    Lower scores indicate higher priority for virtue development.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-200/60">
                                    <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                                    <p className="text-amber-800 font-medium">Assessment Not Completed</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        {practitioner.full_name || 'This practitioner'} has not yet completed their character defect assessment.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Virtue Progress */}
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <BookOpen className="h-6 w-6 text-amber-700" />
                        <div className="flex-1">
                            <CardTitle className="text-stone-800 font-medium">Virtue Progress</CardTitle>
                            <CardDescription className="text-stone-600">Click to view shared reflections</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {virtues.map(virtue => (
                            <div key={virtue.id} className="flex items-center p-3 bg-stone-50/60 rounded-lg border border-stone-200/60">
                                <h3 className="font-medium flex-1 text-stone-800">{virtue.name}</h3>
                                <div className="flex gap-2">
                                    {[1,2,3].map(stageNum => {
                                        const memo = sharedMemos.find(m => m.virtue_id === virtue.id && m.stage_number === stageNum);
                                        return (
                                            <Button 
                                                key={stageNum} 
                                                size="sm" 
                                                className={getButtonStatusClass(virtue.id, stageNum)}
                                                onClick={() => handleSelectMemo(virtue, stageNum)}
                                                disabled={!memo}
                                            >
                                                {stageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel: Content Viewer and Chat */}
            <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="text-stone-800 font-medium">
                            {selectedMemo ? `${selectedMemo.virtue_name} - Stage ${selectedMemo.stage_number}` : 'Select a Reflection'}
                        </CardTitle>
                        <CardDescription className="text-stone-600">
                            {selectedMemo ? `Last updated: ${new Date(selectedMemo.practitioner_updated_at).toLocaleString()}` : 'Click a stage number to view shared reflections.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedMemo ? (
                            <div 
                              className="prose max-w-none p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-stone-200/60" 
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMemo.memo_text || '<em>No content shared.</em>') }} 
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-stone-50/60 rounded-lg border border-stone-200/60">
                                <p className="text-stone-500 font-light">No reflection selected.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <MessageCircle className="h-6 w-6 text-amber-700" />
                        <div>
                            <CardTitle className="text-stone-800 font-medium">Chat with {practitioner.full_name || 'Practitioner'}</CardTitle>
                            <CardDescription className="text-stone-600">Provide guidance and support</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 border border-stone-200/60 p-4 rounded-lg bg-white/40 backdrop-blur-sm flex flex-col shadow-inner">
                            {chatMessages.length > 0 ? chatMessages.map(message => (
                            <div key={message.id} className={`p-3 rounded-lg shadow-gentle flex flex-col transition-all duration-200 ${ 
                                message.sender_id === currentUserId 
                                    ? 'bg-gradient-to-r from-amber-500 to-stone-500 text-white self-end' 
                                    : 'bg-white/80 backdrop-blur-sm text-stone-800 self-start border border-stone-200/60' 
                            } max-w-[70%]`}>
                                <p className={`text-xs mb-1 ${ message.sender_id === currentUserId ? 'text-amber-100' : 'text-stone-500' }`}>
                                <strong>{message.sender_name || 'Unknown'}</strong> - {new Date(message.created_at).toLocaleTimeString()}
                                </p>
                                <p className="whitespace-pre-wrap leading-relaxed">{message.message_text}</p>
                            </div>
                            )) : (
                            <Alert className="border-amber-200 bg-amber-50/60 backdrop-blur-sm">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800">No Messages Yet</AlertTitle>
                            </Alert>
                            )}
                        </div>
                        <div className="flex items-end gap-3">
                            <Textarea 
                                className="flex-grow bg-white/60 backdrop-blur-sm border-stone-300 resize-none transition-all duration-200 focus:bg-white/80" 
                                placeholder="Type your message..." 
                                value={newChatMessage} 
                                onChange={(e) => setNewChatMessage(e.target.value)} 
                                onKeyDown={(e) => { 
                                    if (e.key === 'Enter' && !e.shiftKey) { 
                                        e.preventDefault(); 
                                        handleSendChatMessage(); 
                                    }
                                }} 
                                rows={3}
                            />
                            <Button 
                                onClick={handleSendChatMessage} 
                                size="icon" 
                                className="flex-shrink-0 bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700 text-white shadow-md h-12 w-12 transition-all duration-200"
                            >
                                <Send size={20} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}