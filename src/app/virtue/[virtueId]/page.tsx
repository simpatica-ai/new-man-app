'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { AlertCircle, Send } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TiptapEditor from '@/components/Editor'
import DOMPurify from 'dompurify'
import JournalComponent from '@/components/JournalComponent'

// --- Type Definitions ---
type Prompt = { id: number; prompt_text: string }
type Affirmation = { id: number; text: string }
type Stage = { 
  id: number; 
  stage_number: number; 
  title: string; 
  stage_prompts: Prompt[];
  affirmations: Affirmation[];
}
type Virtue = { 
  id: number; 
  name: string; 
  description: string; 
  story_of_virtue: string | null; 
  author_reflection: string | null; 
  virtue_stages: Stage[] 
}
type StageMemo = { 
  stage_number: number; 
  memo_text: string | null 
}
type ChatMessage = { id: number; sender_id: string; message_text: string; created_at: string; sender_name: string | null; read_at: string | null }

// --- VIRTUE DETAIL PAGE ---
export default function VirtueDetailPage() {
  const [loading, setLoading] = useState(true)
  const [virtue, setVirtue] = useState<Virtue | null>(null)
  const [memos, setMemos] = useState<Map<number, string>>(new Map())
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [activeTab, setActiveTab] = useState("stage-1")
  // ## FIX 1: State to track the last viewed stage for prompts ##
  const [displayedStageNumber, setDisplayedStageNumber] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [connectionId, setConnectionId] = useState<number | null>(null)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const virtueId = params.id || params.virtueId;
  const stageQuery = searchParams.get('stage');

  useEffect(() => {
    if (virtue) {
      document.title = `New-Man-App: Virtue - ${virtue.name}`;
    }
  }, [virtue]);

  const affirmations: Affirmation[] = [
    { id: 1, text: "I approach situations with an open mind, ready to learn." },
    { id: 2, text: "I value the contributions of others and acknowledge their worth." },
    { id: 3, text: "I accept my limitations and ask for help when needed." },
  ]

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

      const virtuePromise = supabase
        .from('virtues')
        .select('*, virtue_stages(*, stage_prompts(*), affirmations(*))')
        .eq('id', virtueId)
        .single();
      
      const memosPromise = supabase
        .from('user_virtue_stage_memos')
        .select('stage_number, memo_text')
        .eq('user_id', user.id)
        .eq('virtue_id', virtueId);

      const connectionPromise = supabase
        .from('sponsor_connections')
        .select('id')
        .or(`practitioner_user_id.eq.${user.id},sponsor_user_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      const [virtueResult, memosResult, connectionResult] = await Promise.all([
        virtuePromise, memosPromise, connectionPromise
      ]);

      if (virtueResult.error) throw virtueResult.error;
      if (virtueResult.data) {
        virtueResult.data.virtue_stages.sort((a, b) => a.stage_number - b.stage_number);
        setVirtue(virtueResult.data);
      }

      if (memosResult.error && memosResult.error.code !== 'PGRST116') throw memosResult.error;
      const memosMap = new Map<number, string>();
      (memosResult.data || []).forEach(memo => { memosMap.set(memo.stage_number, memo.memo_text || ''); });
      setMemos(memosMap);
      
      if (connectionResult.error) throw connectionResult.error;
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
      if (error instanceof Error) {
        console.error("Error fetching page data:", error);
        alert("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [virtueId, router, stageQuery]);

  useEffect(() => {
    fetchPageData()
  }, [fetchPageData])

  const handleSaveMemo = async (stageNumber: number) => {
    const memoText = memos.get(stageNumber) || ""
    if (!currentUserId || !virtue) return

    const { error } = await supabase
      .from('user_virtue_stage_memos')
      .upsert({ 
        user_id: currentUserId,
        virtue_id: virtue.id,
        stage_number: stageNumber,
        memo_text: memoText
      }, { 
        onConflict: 'user_id, virtue_id, stage_number'
      })

    if (error) {
      alert("Error saving memo: " + error.message)
    } else {
      alert("Memo draft for Stage " + stageNumber + " saved successfully.")
    }
  }

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
      alert("Error sending message: " + error.message)
    } else if (newMessage) {
      const { data: { user } } = await supabase.auth.getUser();
      const senderName = user?.user_metadata.full_name || 'You';
      setChatMessages([...chatMessages, { ...newMessage, sender_name: senderName }]);
      setNewChatMessage("");
    }
  }
  
  // ## FIX 1: This now uses displayedStageNumber so prompts don't disappear ##
  const activeStageData = useMemo(() => {
    return virtue?.virtue_stages.find(s => s.stage_number === displayedStageNumber);
  }, [displayedStageNumber, virtue]);

  // ## FIX 1: Custom handler to update the correct state ##
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    if (tabValue.startsWith('stage-')) {
      const stageNum = parseInt(tabValue.split('-')[1]);
      setDisplayedStageNumber(stageNum);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Workspace...</div>
  if (!virtue) return <div className="p-8 text-center">Virtue not found.</div>

  const StageContent = ({ stage }: { stage: Stage }) => {
    // ## FIX 2: Empathetic, growth-oriented titles ##
    const empatheticTitles: { [key: number]: string } = {
      1: "My Private Memo for Stage 1: Gently Exploring Areas for Growth",
      2: "My Private Memo for Stage 2: Building New, Healthy Habits",
      3: "My Private Memo for Stage 3: Maintaining Your Progress with Grace"
    };
    const cardTitle = empatheticTitles[stage.stage_number] || `My Private Memo for ${stage.title}`;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>Use the prompts above to guide your reflection. Your thoughts here are private.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TiptapEditor
            content={memos.get(stage.stage_number) || ''}
            onChange={(html) => setMemos(prev => new Map(prev).set(stage.stage_number, html))}
          />
          <div className="flex justify-end items-center gap-4">
            <Button onClick={() => handleSaveMemo(stage.stage_number)}>Save Memo (Draft)</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/" className="mb-4 inline-block">
            <Button variant="outline">&larr; Back to Dashboard</Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">{virtue.name} Workspace</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader><CardTitle>Prompts</CardTitle></CardHeader>
            <CardContent>
              <Carousel className="w-full max-w-lg mx-auto relative">
                <CarouselContent>
                  {activeStageData?.stage_prompts?.length ? activeStageData.stage_prompts.map((prompt) => (
                    <CarouselItem key={prompt.id}><div className="p-1 h-24 flex items-start justify-center overflow-y-auto"><p className="text-lg italic text-gray-700 text-center">{prompt.prompt_text}</p></div></CarouselItem>
                  )) : (
                    <CarouselItem><div className="p-1 h-24 flex items-center justify-center"><p className="text-gray-500">No prompts for this stage.</p></div></CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
              </Carousel>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Affirmations</CardTitle></CardHeader>
            <CardContent>
              <Carousel className="w-full max-w-lg mx-auto relative">
                <CarouselContent>
                  {affirmations.length > 0 ? affirmations.map((affirmation) => (
                    <CarouselItem key={affirmation.id}><div className="p-1 h-24 flex items-center justify-center"><p className="text-lg italic text-gray-700 text-center">{affirmation.text}</p></div></CarouselItem>
                  )) : (
                    <CarouselItem><div className="p-1 h-24 flex items-center justify-center"><p className="text-gray-500">No affirmations for this stage.</p></div></CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
              </Carousel>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className={`grid w-full gap-2 ${connectionId ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="stage-1">Dismantling</TabsTrigger>
            <TabsTrigger value="stage-2">Building</TabsTrigger>
            <TabsTrigger value="stage-3">Maintaining</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            {connectionId && (
              <TabsTrigger value="chat" className="relative">
                Sponsor Chat
                {hasUnreadMessages && (<span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500" />)}
              </TabsTrigger>
            )}
          </TabsList>

          {[1, 2, 3].map(stageNum => (
            <TabsContent key={stageNum} value={`stage-${stageNum}`}>
              {virtue.virtue_stages.find(s=>s.stage_number === stageNum) && 
                <StageContent stage={virtue.virtue_stages.find(s=>s.stage_number === stageNum)!} />
              }
            </TabsContent>
          ))}
          
          <TabsContent value="journal">
            <Card className="mt-6">
              <CardContent className="pt-6">
                <JournalComponent />
              </CardContent>
            </Card>
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
      </main>
    </div>
  )
}

