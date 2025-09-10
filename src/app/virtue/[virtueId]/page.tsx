'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { AlertCircle, Send, CheckCircle, Edit, Lightbulb, Sparkles, Bot } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TiptapEditor from '@/components/Editor'
import JournalComponent from '@/components/JournalComponent'
import AppHeader from '@/components/AppHeader'

// --- Type Definitions ---
type Prompt = { id: number; prompt_text: string }
type Affirmation = { id: number; text: string }
type Stage = { 
  id: number; 
  stage_number: number; 
  title: string; 
  stage_prompts: Prompt[];
}
type Virtue = { 
  id: number; 
  name: string; 
  description: string; 
  story_of_virtue: string | null; 
  author_reflection: string | null; 
  virtue_stages: Stage[];
  affirmations: Affirmation[]; // CORRECTED: Affirmations are linked to the virtue
}
type ChatMessage = { id: number; sender_id: string; message_text: string; created_at: string; sender_name: string | null; read_at: string | null }
type StageStatus = 'not_started' | 'in_progress' | 'completed';

// --- Standalone StageContent Component for Performance ---
const StageContent = ({ stage, memoContent, status, onMemoChange, onSaveMemo, onCompleteStage, onEditStage }: { 
  stage: Stage, 
  memoContent: string, 
  status: StageStatus,
  onMemoChange: (html: string) => void,
  onSaveMemo: () => Promise<void>,
  onCompleteStage: () => Promise<void>,
  onEditStage: () => Promise<void>
}) => {
    const [isSaving, setIsSaving] = useState(false);
    
    const empatheticTitles: { [key: number]: string } = {
      1: "My Private Memo for Stage 1: Gently Exploring Areas for Growth",
      2: "My Private Memo for Stage 2: Building New, Healthy Habits",
      3: "My Private Memo for Stage 3: Maintaining Your Progress with Grace"
    };
    const cardTitle = empatheticTitles[stage.stage_number] || `My Private Memo for ${stage.title}`;

    const handleSave = async () => {
      setIsSaving(true);
      await onSaveMemo();
      setIsSaving(false);
    }
    
    const handleComplete = async () => {
      setIsSaving(true);
      await onCompleteStage();
      setIsSaving(false);
    }

    const StatusBadge = () => {
        if (status === 'completed') {
            return <div className="flex items-center gap-2 text-green-600 font-semibold"><CheckCircle size={18} /><span>Completed</span></div>
        }
        if (status === 'in_progress') {
            return <div className="flex items-center gap-2 text-amber-600 font-semibold"><Edit size={18} /><span>In Progress</span></div>
        }
        return null;
    }

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>Use the prompts above to guide your reflection. Your thoughts here are private.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TiptapEditor
            content={memoContent}
            onChange={onMemoChange}
          />
          <div className="flex justify-end items-center gap-4">
            <div className="flex-grow">
              <StatusBadge />
            </div>
            {status === 'completed' ? (
              <Button variant="outline" onClick={onEditStage}>Edit Completed Memo</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Memo (Draft)'}</Button>
                <Button onClick={handleComplete} disabled={isSaving}>{isSaving ? 'Saving...' : 'Mark as Complete'}</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
};

// --- VIRTUE DETAIL PAGE ---
export default function VirtueDetailPage() {
  const [loading, setLoading] = useState(true)
  const [virtue, setVirtue] = useState<Virtue | null>(null)
  const [memos, setMemos] = useState<Map<number, string>>(new Map())
  const [progress, setProgress] = useState<Map<string, StageStatus>>(new Map())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [activeTab, setActiveTab] = useState("stage-1")
  const [displayedStageNumber, setDisplayedStageNumber] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [connectionId, setConnectionId] = useState<number | null>(null)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [defectAnalysis, setDefectAnalysis] = useState<any>(null)
  const [stage1AiPrompt, setStage1AiPrompt] = useState<string | null>(null)
  const [isPromptLoading, setIsPromptLoading] = useState(false)

  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const virtueId = params.id || params.virtueId;
  const stageQuery = searchParams.get('stage');

  useEffect(() => {
    if (virtue) {
      document.title = `New Man: Virtue - ${virtue.name}`;
    }
  }, [virtue]);

  const fetchPageData = useCallback(async () => {
    if (!virtueId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setCurrentUserId(user.id);

      // CORRECTED: Updated Supabase query to match the new schema
      const virtuePromise = supabase.from('virtues').select('*, virtue_stages(*, stage_prompts(*)), affirmations(*)').eq('id', virtueId).single();
      const memosPromise = supabase.from('user_virtue_stage_memos').select('stage_number, memo_text').eq('user_id', user.id).eq('virtue_id', virtueId);
      const progressPromise = supabase.from('user_virtue_stage_progress').select('stage_number, status').eq('user_id', user.id).eq('virtue_id', virtueId);
      const connectionPromise = supabase.from('sponsor_connections').select('id').or(`practitioner_user_id.eq.${user.id},sponsor_user_id.eq.${user.id}`).eq('status', 'active').maybeSingle();
      const defectAnalysisPromise = supabase.from('virtue_analysis').select('*').eq('user_id', user.id).eq('virtue_id', virtueId).single();

      const [virtueResult, memosResult, progressResult, connectionResult, defectAnalysisResult] = await Promise.all([virtuePromise, memosPromise, progressPromise, connectionPromise, defectAnalysisPromise]);

      if (virtueResult.error) throw virtueResult.error;
      if (virtueResult.data) {
        virtueResult.data.virtue_stages.sort((a: Stage, b: Stage) => a.stage_number - b.stage_number);
        setVirtue(virtueResult.data);
      }

      if (memosResult.error && memosResult.error.code !== 'PGRST116') throw memosResult.error;
      const memosMap = new Map<number, string>();
      (memosResult.data || []).forEach(memo => { memosMap.set(memo.stage_number, memo.memo_text || ''); });
      setMemos(memosMap);

      if (progressResult.error) throw progressResult.error;
      const progressMap = new Map<string, StageStatus>();
      (progressResult.data || []).forEach(p => progressMap.set(`${virtueId}-${p.stage_number}`, p.status as StageStatus));
      setProgress(progressMap);
      
      if (connectionResult.error) throw connectionResult.error;
      
      if (defectAnalysisResult.error && defectAnalysisResult.error.code !== 'PGRST116') {
        console.error("Error fetching defect analysis:", defectAnalysisResult.error);
      }
      if (defectAnalysisResult.data) {
        setDefectAnalysis(defectAnalysisResult.data);
      }
      if (connectionResult.data) {
        setConnectionId(connectionResult.data.id);
        const { data: rawMessages, error: messagesError } = await supabase
          .from('sponsor_chat_messages')
          .select('id, sender_id, message_text, created_at, read_at')
          .eq('connection_id', connectionResult.data.id)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;

        if (rawMessages && rawMessages.length > 0) {
          const senderIds = [...new Set(rawMessages.map(msg => msg.sender_id))];
          const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', senderIds);
          const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]));
          const combinedMessages = rawMessages.map(msg => ({...msg, sender_name: profileMap.get(msg.sender_id) || 'User'}));
          setChatMessages(combinedMessages);
          setHasUnreadMessages(combinedMessages.some(msg => msg.sender_id !== user.id && !msg.read_at));
        }
      }
      
      const initialStage = parseInt(stageQuery || '1');
      if (stageQuery && ['1', '2', '3'].includes(stageQuery)) {
        setActiveTab(`stage-${stageQuery}`);
        setDisplayedStageNumber(initialStage);
      } else if (virtueResult.data?.virtue_stages.length > 0) {
        setActiveTab(`stage-1`);
        setDisplayedStageNumber(1);
      }

    } catch (error) {
      if (error instanceof Error) console.error("Error fetching page data:", error);
    } finally {
      setLoading(false);
    }
  }, [virtueId, router, stageQuery]);

  useEffect(() => {
    fetchPageData()
  }, [fetchPageData])

  const fetchStage1Prompt = useCallback(async () => {
    if (!virtue || !defectAnalysis) return;

    setIsPromptLoading(true);
    try {
      const response = await fetch('https://getstage1-917009769018.us-central1.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtueName: virtue.name,
          virtueDef: virtue.description,
          characterDefectAnalysis: defectAnalysis.analysis_text,
          stage1MemoContent: memos.get(1) || ''
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Stage 1 prompt');
      }
      const data = await response.json();
      setStage1AiPrompt(data.prompt);

    } catch (error) {
      console.error("Error fetching Stage 1 AI prompt:", error);
      setStage1AiPrompt("Could not load a suggestion. Please try reloading.");
    } finally {
      setIsPromptLoading(false);
    }
  }, [virtue, defectAnalysis, memos]);

  useEffect(() => {
    if (displayedStageNumber === 1 && virtue && defectAnalysis) {
      fetchStage1Prompt();
    }
  }, [displayedStageNumber, virtue, defectAnalysis, fetchStage1Prompt]);

  const updateStageStatus = async (stageNumber: number, status: StageStatus) => {
    if (!currentUserId || !virtue) return { error: { message: 'User or virtue not loaded.' } };

    return supabase
      .from('user_virtue_stage_progress')
      .upsert({
          user_id: currentUserId,
          virtue_id: virtue.id,
          stage_number: stageNumber,
          status: status
      }, { onConflict: 'user_id, virtue_id, stage_number' });
  };
  
  const handleEditStage = async (stageNumber: number) => {
    const { error } = await updateStageStatus(stageNumber, 'in_progress');
    if (error) console.error("Error updating status:", error.message);
    await fetchPageData();
  };

  const handleSaveMemo = async (stageNumber: number) => {
    const memoText = memos.get(stageNumber) || ""
    if (!currentUserId || !virtue) return

    const saveMemoPromise = supabase.from('user_virtue_stage_memos').upsert({ 
        user_id: currentUserId,
        virtue_id: virtue.id,
        stage_number: stageNumber,
        memo_text: memoText
    }, { onConflict: 'user_id, virtue_id, stage_number' });
    
    const updateProgressPromise = updateStageStatus(stageNumber, 'in_progress');

    const [memoResult, progressResult] = await Promise.all([saveMemoPromise, updateProgressPromise]);

    if (memoResult.error || progressResult.error) {
      console.error("Error saving memo:", memoResult.error?.message || progressResult.error?.message);
    }
    await fetchPageData();
    
    if (stageNumber === 1) {
      fetchStage1Prompt();
    }
  }

  const handleCompleteStage = async (stageNumber: number) => {
    if (!virtue) return;
    const { error } = await updateStageStatus(stageNumber, 'completed');
    if (error) console.error("Error completing stage:", error.message);
    await fetchPageData();
  };
  
  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !currentUserId || !connectionId) return;

    const { data: newMessage, error } = await supabase
      .from('sponsor_chat_messages')
      .insert({
        connection_id: connectionId,
        sender_id: currentUserId,
        message_text: newChatMessage
      })
      .select('id, sender_id, message_text, created_at, read_at')
      .single()

    if (error) {
      // No alert for errors
    } else if (newMessage) {
      const { data: { user } } = await supabase.auth.getUser();
      const senderName = user?.user_metadata.full_name || 'You';
      setChatMessages([...chatMessages, { ...newMessage, sender_name: senderName }]);
      setNewChatMessage("");
    }
  }
  
  const activeStageData = useMemo(() => virtue?.virtue_stages.find(s => s.stage_number === displayedStageNumber), [displayedStageNumber, virtue]);
  
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    if (tabValue.startsWith('stage-')) {
      setDisplayedStageNumber(parseInt(tabValue.split('-')[1]));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader />
      <div className="p-8 text-center">Loading Workspace...</div>
    </div>
  )
  if (!virtue) return (
     <div className="min-h-screen bg-stone-50">
      <AppHeader />
      <div className="p-8 text-center">Virtue not found.</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <AppHeader />
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-stone-800">{virtue.name} Workspace</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* --- LEFT COLUMN (MAIN CONTENT) --- */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className={`grid w-full gap-2 ${connectionId ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <TabsTrigger value="stage-1">Stage 1: Dismantling</TabsTrigger>
                <TabsTrigger value="stage-2">Stage 2: Building</TabsTrigger>
                <TabsTrigger value="stage-3">Stage 3: Maintaining</TabsTrigger>
                <TabsTrigger value="journal">Journal</TabsTrigger>
                {connectionId && (
                  <TabsTrigger value="chat" className="relative">
                    Sponsor Chat
                    {hasUnreadMessages && (<span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500" />)}
                  </TabsTrigger>
                )}
              </TabsList>

              {[1, 2, 3].map(stageNum => {
                const stageData = virtue.virtue_stages.find(s=>s.stage_number === stageNum);
                const status = progress.get(`${virtueId}-${stageNum}`) || 'not_started';
                return (
                    <TabsContent key={stageNum} value={`stage-${stageNum}`}>
                      {stageData && 
                        <StageContent 
                          stage={stageData} 
                          memoContent={memos.get(stageNum) || ''}
                          status={status}
                          onMemoChange={(html) => setMemos(prev => new Map(prev).set(stageNum, html))}
                          onSaveMemo={() => handleSaveMemo(stageNum)}
                          onCompleteStage={() => handleCompleteStage(stageNum)}
                          onEditStage={() => handleEditStage(stageNum)}
                        />
                      }
                    </TabsContent>
                )
              })}
              
              <TabsContent value="journal">
                <Card className="mt-6"><CardContent className="pt-6"><JournalComponent /></CardContent></Card>
              </TabsContent>

              <TabsContent value="chat">
                <Card className="mt-6">
                  <CardHeader><CardTitle>Chat with your Sponsor</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 border p-4 rounded-md bg-stone-100 flex flex-col">
                      {chatMessages.length > 0 ? chatMessages.map(message => (
                        <div key={message.id} className={`p-3 rounded-lg shadow-sm flex flex-col ${ message.sender_id === currentUserId ? 'bg-blue-600 text-white self-end' : 'bg-white text-stone-800 self-start' } max-w-[70%]`}>
                          <p className={`text-xs mb-1 ${ message.sender_id === currentUserId ? 'text-blue-200' : 'text-stone-500' }`}><strong>{message.sender_name}</strong> - {new Date(message.created_at).toLocaleTimeString()}</p>
                          <p className="whitespace-pre-wrap">{message.message_text}</p>
                        </div>
                      )) : (<Alert><AlertCircle className="h-4 w-4" /><AlertTitle>No Messages Yet</AlertTitle><AlertDescription>Start the conversation.</AlertDescription></Alert>)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Textarea className="flex-grow bg-white" placeholder="Type your message..." value={newChatMessage} onChange={(e) => setNewChatMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessage(); }}} />
                      <Button onClick={handleSendChatMessage} size="icon" className="flex-shrink-0"><Send size={18} /></Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* --- RIGHT COLUMN (SUPPORTING CARDS) --- */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            {displayedStageNumber === 1 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                  <Bot className="h-8 w-8 text-amber-700 flex-shrink-0" />
                  <div>
                    <CardTitle className="text-stone-800">AI Guided Reflection</CardTitle>
                    <CardDescription>Stage 1: Dismantling</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {isPromptLoading && (
                    <p className="text-stone-600 animate-pulse">Generating your personalized prompt...</p>
                  )}
                  {!isPromptLoading && stage1AiPrompt && (
                    <p className="text-base text-stone-700 whitespace-pre-wrap">{stage1AiPrompt}</p>
                  )}
                </CardContent>
              </Card>
            )}
            
            {displayedStageNumber !== 1 && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <Lightbulb className="h-8 w-8 text-amber-700" />
                    <div><CardTitle className="text-stone-800">Prompts</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <Carousel className="w-full max-w-lg mx-auto relative">
                      <CarouselContent>
                        {activeStageData?.stage_prompts?.length ? activeStageData.stage_prompts.map((prompt) => (
                          <CarouselItem key={prompt.id}><div className="p-1 h-28 flex items-center justify-center overflow-y-auto"><p className="text-base text-stone-700 text-center">{prompt.prompt_text}</p></div></CarouselItem>
                        )) : (
                          <CarouselItem><div className="p-1 h-28 flex items-center justify-center"><p className="text-gray-500">No prompts for this stage.</p></div></CarouselItem>
                        )}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-[-45px] top-1/2 -translate-y-1/2" />
                      <CarouselNext className="absolute right-[-45px] top-1/2 -translate-y-1/2" />
                    </Carousel>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <Sparkles className="h-8 w-8 text-amber-700" />
                    <div><CardTitle className="text-stone-800">Affirmations</CardTitle></div>
                  </CardHeader>
                  <CardContent>
                    <Carousel className="w-full max-w-lg mx-auto relative">
                      <CarouselContent>
                        {virtue?.affirmations?.length ? virtue.affirmations.map((affirmation) => (
                          <CarouselItem key={affirmation.id}><div className="p-1 h-28 flex items-center justify-center"><p className="text-base text-stone-700 text-center">{affirmation.text}</p></div></CarouselItem>
                        )) : (
                          <CarouselItem><div className="p-1 h-28 flex items-center justify-center"><p className="text-gray-500">No affirmations for this virtue.</p></div></CarouselItem>
                        )}
                      </CarouselContent>
                      <CarouselPrevious className="absolute left-[-45px] top-1/2 -translate-y-1/2" />
                      <CarouselNext className="absolute right-[-45px] top-1/2 -translate-y-1/2" />
                    </Carousel>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
