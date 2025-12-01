'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Send, AlertCircle, MessageCircle, BookOpen, Bell, BarChart3 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import VirtueRoseChart from '@/components/VirtueRoseChart';
import VirtueRow from '@/components/dashboard/VirtueRow';
import { Virtue as VirtueType } from '@/lib/constants';
import DOMPurify from 'dompurify';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import VirtueAssessmentPDF from '@/app/assessment/VirtueAssessmentPDF';
import { Download } from 'lucide-react';
import { convertChartToImage } from '@/utils/chartToImage';

// --- Type Definitions ---
type PractitionerProfile = {
  id: string;
  full_name: string | null;
};

type SharedMemo = {
  virtue_id: number;
  stage_number: number;
  memo_text: string | null;
};

// Using Virtue type from constants

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
  const [virtues, setVirtues] = useState<VirtueType[]>([]);
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
  const [progress, setProgress] = useState<Map<string, string>>(new Map());

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
      const virtuesPromise = supabase.from('virtues').select('id, name, description, short_description').order('id');
      // Query user_virtue_stage_memos to get the actual memo content
      const memosPromise = supabase.from('user_virtue_stage_memos').select('virtue_id, stage_number, memo_text').eq('user_id', practitionerId);
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

      if (memosResult.error) {
        console.error('❌ Memos error:', memosResult.error);
      } else {
        const memos = memosResult.data || [];
        setSharedMemos(memos);
        console.log('✅ Memos loaded:', memos.length, memos);
        
        // For now, treat all memos as unread (we can add read tracking later)
        setUnreadCount(memos.length);
      }
      
      // Process virtue stage progress
      if (progressResult.error) {
        console.error('❌ Progress error:', progressResult.error);
      } else if (progressResult.data) {
        console.log('✅ Progress loaded:', progressResult.data.length);
        // Build progress map like the personal dashboard does
        const progressMap = new Map<string, string>();
        progressResult.data.forEach((p: {virtue_id: number; stage_number: number; status: string}) => {
          progressMap.set(`${p.virtue_id}-${p.stage_number}`, p.status);
        });
        setProgress(progressMap);
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

  // Custom status classes for sponsor view - shows progress and memo availability
  const getSponsorStatusClasses = (virtueId: number, stage: number) => {
    const progressStatus = progress.get(`${virtueId}-${stage}`);
    const memo = sharedMemos.find(m => m.virtue_id === virtueId && m.stage_number === stage);
    
    // If completed, show green
    if (progressStatus === 'completed') {
      return 'bg-green-500 hover:bg-green-600';
    }
    
    // If in progress, show amber
    if (progressStatus === 'in_progress') {
      return 'bg-amber-500 hover:bg-amber-600';
    }
    
    // If there's a memo but no progress status, show it's available
    if (memo && memo.memo_text) {
      return 'bg-stone-500 hover:bg-stone-600';
    }
    
    // Default: not started
    return 'bg-stone-200';
  };

  const handleSelectMemo = (virtue: VirtueType, stageNumber: number) => {
    console.log('🔍 Selecting memo:', virtue.name, stageNumber);
    console.log('📝 Available memos:', sharedMemos);
    
    const memo = sharedMemos.find(m => m.virtue_id === virtue.id && m.stage_number === stageNumber);
    console.log('📄 Found memo:', memo);
    
    if (memo && memo.memo_text) {
      console.log('✅ Opening memo with text:', memo.memo_text.substring(0, 50) + '...');
      setSelectedMemo({ ...memo, virtue_name: virtue.name });
    } else {
      console.log('⚠️ No memo found for this stage');
      setSelectedMemo(null);
    }
  };

  const getButtonStatusClass = (virtueId: number, stageNumber: number) => {
    // Check progress status first
    const progressStatus = progress.get(`${virtueId}-${stageNumber}`);
    const memo = sharedMemos.find(m => m.virtue_id === virtueId && m.stage_number === stageNumber);
    
    // If no progress and no memo, button is disabled
    if (!progressStatus && !memo) {
      return 'bg-stone-200 hover:bg-stone-300 text-stone-500 cursor-not-allowed';
    }
    
    // If completed, show green
    if (progressStatus === 'completed') {
      return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white';
    }
    
    // If in progress, show amber
    if (progressStatus === 'in_progress') {
      return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white';
    }
    
    // If there's a memo, show it's available
    if (memo && memo.memo_text) {
      return 'bg-gradient-to-r from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700 text-white cursor-pointer';
    }
    
    // Default: not started
    return 'bg-stone-200 hover:bg-stone-300 text-stone-500 cursor-not-allowed';
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
            {/* Left Panel: Virtue List */}
            <div className="space-y-6">
                {/* Virtue Progress */}
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <BookOpen className="h-6 w-6 text-amber-700" />
                        <div className="flex-1">
                            <CardTitle className="text-stone-800 font-medium">Virtue Progress</CardTitle>
                            <CardDescription className="text-stone-600">Click stage buttons to view practitioner reflections</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {virtues.map(virtue => {
                                // Get virtue score from assessment data
                                const assessment = assessmentData.find(a => a.virtue_name === virtue.name);
                                // Convert priority_score to 0-10 scale (lower priority_score = higher virtue score)
                                // Assuming priority_score ranges from 0-125 (5 defects * 25 max each)
                                const maxPriorityScore = 125;
                                const virtueScore = assessment 
                                    ? Math.max(0, 10 - ((assessment.priority_score / maxPriorityScore) * 10))
                                    : 5; // Default to middle if no assessment
                                const virtueWithScore = { ...virtue, virtue_score: virtueScore };
                                
                                return (
                                    <li key={virtue.id} className="flex flex-col gap-3 md:gap-4 p-3 md:p-4 border border-stone-200/60 rounded-lg bg-white/80 backdrop-blur-sm shadow-gentle transition-mindful hover:shadow-lg">
                                        {hasAssessment && (
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                                        <path 
                                                            className="text-stone-200" 
                                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            strokeWidth="2" 
                                                        />
                                                        <path 
                                                            className="text-amber-600" 
                                                            strokeDasharray={`${(virtueWithScore.virtue_score || 0) * 10}, 100`} 
                                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            strokeWidth="2" 
                                                        />
                                                    </svg>
                                                    <span className="absolute text-lg md:text-xl font-semibold text-stone-700">
                                                        {(virtueWithScore.virtue_score || 0).toFixed(1)}
                                                    </span>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="font-semibold text-base md:text-lg text-stone-800 truncate">{virtue.name}</h3>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex-grow">
                                            {!hasAssessment && (
                                                <h3 className="font-semibold text-base md:text-lg text-stone-800 mb-2">{virtue.name}</h3>
                                            )}
                                            <p className="text-stone-600 text-sm mb-3 leading-relaxed">
                                                {virtue.short_description || virtue.description}
                                            </p>
                                            
                                            {/* Stage buttons for sponsor to view memos */}
                                            <div className="flex items-center justify-between py-2">
                                                <div className="flex items-center gap-2 flex-1">
                                                    {[
                                                        { stage: 1, name: 'Dismantling', color: '#A0522D' },
                                                        { stage: 2, name: 'Building', color: '#6B8E23' },
                                                        { stage: 3, name: 'Practicing', color: '#556B2F' }
                                                    ].map(({ stage, name, color }, index) => {
                                                        const stageStatus = progress.get(`${virtue.id}-${stage}`);
                                                        const memo = sharedMemos.find(m => m.virtue_id === virtue.id && m.stage_number === stage);
                                                        const hasContent = memo && memo.memo_text;
                                                        // Allow clicking if stage is completed OR in_progress (both should have content)
                                                        const isClickable = stageStatus === 'completed' || stageStatus === 'in_progress';
                                                        
                                                        return (
                                                            <div key={stage} className="flex items-center flex-1">
                                                                <div className="flex flex-col items-center">
                                                                    <button
                                                                        onClick={() => isClickable && handleSelectMemo(virtue, stage)}
                                                                        disabled={!isClickable}
                                                                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm ${
                                                                            isClickable
                                                                                ? 'cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 transform' 
                                                                                : 'cursor-default opacity-60'
                                                                        } ${
                                                                            stageStatus === 'completed' 
                                                                                ? 'bg-gradient-to-br from-white to-gray-50' 
                                                                                : stageStatus === 'in_progress' 
                                                                                ? 'bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200' 
                                                                                : 'bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100'
                                                                        }`}
                                                                        style={{
                                                                            borderColor: color,
                                                                            color: stageStatus === 'completed' ? color : 
                                                                                   stageStatus === 'in_progress' ? '#92400E' : color
                                                                        }}
                                                                    >
                                                                        {stageStatus === 'completed' ? (
                                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        ) : (
                                                                            <span className="text-xs font-semibold">{stage}</span>
                                                                        )}
                                                                    </button>
                                                                    <span 
                                                                        className="text-xs font-medium mt-1 text-center"
                                                                        style={{ color }}
                                                                    >
                                                                        {name}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* Connecting Line */}
                                                                {index < 2 && (
                                                                    <div className="flex-1 h-0.5 mx-2 bg-stone-300 relative">
                                                                        <div 
                                                                            className="h-full transition-all duration-500"
                                                                            style={{
                                                                                backgroundColor: stageStatus === 'completed' ? color : 'transparent',
                                                                                width: stageStatus === 'completed' ? '100%' : '0%'
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel: Content Viewer, Chat, and Assessment */}
            <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                    <CardHeader>
                        <CardTitle className="text-stone-800 font-medium">
                            {selectedMemo ? `${selectedMemo.virtue_name} - Stage ${selectedMemo.stage_number}` : 'Select a Reflection'}
                        </CardTitle>
                        <CardDescription className="text-stone-600">
                            {selectedMemo ? 'Practitioner reflection' : 'Click a stage button to view practitioner reflections.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedMemo ? (
                            <div 
                              className="prose max-w-none p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-stone-200/60 max-h-[500px] overflow-y-auto" 
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
                                <div className="flex justify-center" data-testid="virtue-chart">
                                    <VirtueRoseChart 
                                        data={virtues.map(v => {
                                            const assessment = assessmentData.find(a => a.virtue_name === v.name);
                                            const defectCount = 5;
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
                                <div className="flex justify-center">
                                    <Button
                                        onClick={async () => {
                                            try {
                                                // Capture the chart image first
                                                console.log('Capturing chart image...');
                                                const chartImage = await convertChartToImage('sponsor-pdf');
                                                console.log('Chart image captured:', !!chartImage);
                                                
                                                // Fetch all data needed for PDF
                                                const [analysisRes, resultsRes, summaryRes] = await Promise.all([
                                                    supabase
                                                        .from('virtue_analysis')
                                                        .select('analysis_text, virtue_id, virtues(name)')
                                                        .eq('user_id', practitionerId),
                                                    supabase
                                                        .from('user_assessment_results')
                                                        .select('virtue_name, priority_score, defect_intensity')
                                                        .eq('user_id', practitionerId),
                                                    supabase
                                                        .from('user_assessments')
                                                        .select('summary_analysis')
                                                        .eq('user_id', practitionerId)
                                                        .order('created_at', { ascending: false })
                                                        .limit(1)
                                                        .single()
                                                ]);
                                                
                                                if (analysisRes.error) throw analysisRes.error;
                                                if (!analysisRes.data || analysisRes.data.length === 0) {
                                                    alert('No virtue plan available for this practitioner yet.');
                                                    return;
                                                }
                                                
                                                // Build analyses map
                                                const analysesMap = new Map();
                                                analysisRes.data.forEach(a => {
                                                    if (a.virtues?.name) {
                                                        analysesMap.set(a.virtues.name, a.analysis_text);
                                                    }
                                                });
                                                
                                                // Build results array for PDF
                                                const results = resultsRes.data?.map(r => ({
                                                    virtue: r.virtue_name,
                                                    priority: r.priority_score,
                                                    defectIntensity: r.defect_intensity || 0,
                                                    score: Math.max(0, 10 - (r.priority_score / 125) * 10)
                                                })) || [];
                                                
                                                // Generate PDF
                                                const pdfDoc = (
                                                    <VirtueAssessmentPDF
                                                        results={results}
                                                        analyses={analysesMap}
                                                        summaryAnalysis={summaryRes.data?.summary_analysis || 'No summary available.'}
                                                        userName={practitioner.full_name || 'Practitioner'}
                                                        chartImage={chartImage}
                                                    />
                                                );
                                                
                                                const blob = await pdf(pdfDoc).toBlob();
                                                saveAs(blob, `Virtue_Plan_${practitioner.full_name}_${new Date().toISOString().split('T')[0]}.pdf`);
                                            } catch (error) {
                                                console.error('Error generating PDF:', error);
                                                alert('Failed to generate PDF. Please try again.');
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700 text-white shadow-md hover:shadow-lg"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Virtue Plan PDF
                                    </Button>
                                </div>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}