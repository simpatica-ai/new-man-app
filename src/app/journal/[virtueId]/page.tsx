'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
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

// --- Type Definitions ---
type Prompt = { id: number; prompt_text: string }
type Affirmation = { id: number; text: string }
type Stage = { id: number; stage_number: number; title: string; stage_prompts: Prompt[] }
type Virtue = { 
  id: number; 
  name: string; 
  description: string; 
  short_description: string | null;
  story_of_virtue: string | null; 
  author_reflection: string | null; 
  virtue_stages: Stage[] 
}
// Removed unused 'StageMemo' type
type JournalEntry = { id: number; entry_text: string; created_at: string }
type ChatMessage = { id: number; sender_id: string; message_text: string; created_at: string; sender_name: string | null; read_at: string | null }

export default function VirtueJournalPage() {
  const [loading, setLoading] = useState(true)
  const [virtue, setVirtue] = useState<Virtue | null>(null)
  const [stageMemos, setStageMemos] = useState<Map<number, string>>(new Map())
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newJournalEntry, setNewJournalEntry] = useState("")
  const [newChatMessage, setNewChatMessage] = useState("")
  const [activeTab, setActiveTab] = useState("stage-1")
  const [activeStage, setActiveStage] = useState("stage-1")
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [connectionId, setConnectionId] = useState<number | null>(null)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  const params = useParams()
  const router = useRouter()
  const virtueId = Number(params.virtueId)

  const affirmations: Affirmation[] = [
    { id: 1, text: "I approach situations with an open mind, ready to learn." },
    { id: 2, text: "I value the contributions of others and acknowledge their worth." },
    { id: 3, text: "I accept my limitations and ask for help when needed." },
  ]

  const fetchPageData = useCallback(async () => {
    if (!virtueId) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setCurrentUserId(user.id);

      const virtuePromise = supabase
        .from('virtues')
        .select('id, name, description, short_description, story_of_virtue, author_reflection, virtue_stages (*, stage_prompts (*))')
        .eq('id', virtueId)
        .single();
      
      const memosPromise = supabase
        .from('practitioner_stage_memos')
        .select('stage_number, memo_text')
        .eq('user_id', user.id)
        .eq('virtue_id', virtueId);

      const journalPromise = supabase
        .from('practitioner_freeform_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const [virtueResult, memosResult, journalResult] = await Promise.all([
        virtuePromise,
        memosPromise,
        journalPromise,
      ]);

      if (virtueResult.error) throw virtueResult.error;
      if (virtueResult.data) {
        virtueResult.data.virtue_stages.sort((a, b) => a.stage_number - b.stage_number);
        setVirtue(virtueResult.data);
      }

      if (memosResult.error) throw memosResult.error;
      if (memosResult.data) {
        const memosMap = new Map<number, string>();
        memosResult.data.forEach(memo => { memosMap.set(memo.stage_number, memo.memo_text || ''); });
        setStageMemos(memosMap);
      }

      if (journalResult.error) throw journalResult.error;
      setJournalEntries(journalResult.data || []);

      const { data: connectionData, error: connectionError } = await supabase
        .from('sponsor_connections')
        .select('id')
        .or(`practitioner_user_id.eq.${user.id},sponsor_user_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      if (connectionError) throw connectionError;

      if (connectionData) {
        setConnectionId(connectionData.id);

        const { data: rawMessages, error: messagesError } = await supabase
          .from('sponsor_chat_messages')
          .select('id, sender_id, message_text, created_at, read_at')
          .eq('connection_id', connectionData.id)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;

        if (rawMessages && rawMessages.length > 0) {
          const senderIds = [...new Set(rawMessages.map(msg => msg.sender_id))];

          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', senderIds);
          
          if (profilesError) throw profilesError;

          const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));
          const combinedMessages = rawMessages.map(msg => ({
            ...msg,
            sender_name: profileMap.get(msg.sender_id) || 'Unknown User'
          }));

          setChatMessages(combinedMessages);
          setHasUnreadMessages(combinedMessages.some(msg => msg.sender_id !== user.id && !msg.read_at));
        } else {
          setChatMessages([]);
        }
      } else {
        setChatMessages([]);
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching page data:", error);
        alert("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [virtueId, router]);

  useEffect(() => {
    fetchPageData()
  }, [fetchPageData])

  const handleSaveMemo = async (stageNumber: number) => {
    const memoText = stageMemos.get(stageNumber) || ""
    if (!currentUserId || !virtue) return

    const { error } = await supabase
      .from('practitioner_stage_memos')
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

  const handleUpdateSponsor = async (stageNumber: number) => {
    const memoText = stageMemos.get(stageNumber) || "";
    if (!currentUserId || !virtue) return;

    if (!confirm("This will make your current memo for this stage visible to your sponsor. Are you sure?")) {
      return;
    }

    const { error } = await supabase
      .from('sponsor_visible_memos')
      .upsert({
        user_id: currentUserId,
        virtue_id: virtue.id,
        stage_number: stageNumber,
        memo_text: memoText,
        practitioner_updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id, virtue_id, stage_number'
      });

    if (error) {
      alert("Error updating sponsor: " + error.message);
    } else {
      alert("Sponsor has been updated with your latest memo for Stage " + stageNumber + ".");
    }
  };

  const handleSaveJournal = async () => {
    if (!newJournalEntry.trim() || !currentUserId) return
    const { data: newEntry, error } = await supabase
      .from('practitioner_freeform_entries')
      .insert({ user_id: currentUserId, entry_text: newJournalEntry })
      .select()
      .single()

    if (error) {
      alert("Error saving journal entry: " + error.message)
    } else {
      if (newEntry) {
        setJournalEntries([newEntry, ...journalEntries])
      }
      setNewJournalEntry("")
    }
  }

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !currentUserId || !connectionId || !virtue) return

    const { data: connection, error: connectionError } = await supabase
      .from('sponsor_connections')
      .select('practitioner_user_id, sponsor_user_id')
      .eq('id', connectionId)
      .single()

    if (connectionError) {
      alert("Error fetching connection: " + connectionError.message)
      return
    }

    const receiverId = connection.practitioner_user_id === currentUserId 
      ? connection.sponsor_user_id 
      : connection.practitioner_user_id

    const { data: newMessage, error } = await supabase
      .from('sponsor_chat_messages')
      .insert({
        connection_id: connectionId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        message_text: newChatMessage
      })
      .select('id, sender_id, message_text, created_at, read_at')
      .single()

    if (error) {
      alert("Error sending message: " + error.message)
    } else {
      if (newMessage) {
        const { data: { user } } = await supabase.auth.getUser()
        const senderName = user?.user_metadata.full_name || 'You';
        setChatMessages([...chatMessages, { ...newMessage, sender_name: senderName }])
      }
      setNewChatMessage("")
    }
  }

  const handleMarkMessagesRead = async () => {
    if (!connectionId || !currentUserId) return
    const { error } = await supabase
      .from('sponsor_chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('connection_id', connectionId)
      .eq('receiver_id', currentUserId)
      .is('read_at', null)

    if (error) {
      alert("Error marking messages as read: " + error.message)
    } else {
      setChatMessages(messages => messages.map(msg => 
        msg.sender_id !== currentUserId && !msg.read_at 
          ? { ...msg, read_at: new Date().toISOString() } 
          : msg
      ))
      setHasUnreadMessages(false)
    }
  }

  const activeStagePrompts = useMemo(() => {
    const stageNumber = parseInt(activeStage.split('-')[1])
    if (isNaN(stageNumber)) return []
    return virtue?.virtue_stages.find(s => s.stage_number === stageNumber)?.stage_prompts || []
  }, [virtue, activeStage])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value.startsWith('stage-')) {
      setActiveStage(value)
    }
    if (value === 'sponsor' && hasUnreadMessages) {
        handleMarkMessagesRead();
    }
  }

  if (loading) return <div className="p-8 text-center">Loading Workspace...</div>
  if (!virtue) return <div className="p-8 text-center">Virtue not found.</div>

  const getStageTitle = (stageNumber: number) => {
    return virtue.virtue_stages.find(s => s.stage_number === stageNumber)?.title || `Stage ${stageNumber}`
  }

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen">
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
                {activeStagePrompts.length > 0 ? activeStagePrompts.map((prompt) => (
                  <CarouselItem key={prompt.id}>
                    <div className="p-1 h-24 flex items-start justify-center">
                      <p className="text-lg italic text-gray-700 text-center overflow-y-auto max-h-full">{prompt.prompt_text}</p>
                    </div>
                  </CarouselItem>
                )) : (
                  <CarouselItem>
                    <div className="p-1 h-24 flex items-center justify-center">
                      <p className="text-gray-500">No prompts for this stage.</p>
                    </div>
                  </CarouselItem>
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
                {affirmations.map((affirmation) => (
                  <CarouselItem key={affirmation.id}>
                    <div className="p-1 h-24 flex items-start justify-center">
                      <p className="text-lg italic text-gray-700 text-center overflow-y-auto max-h-full">{affirmation.text}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
            </Carousel>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className={`grid w-full gap-2 ${connectionId ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="stage-1">Dismantling</TabsTrigger>
          <TabsTrigger value="stage-2">Building</TabsTrigger>
          <TabsTrigger value="stage-3">Maintaining</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          
          {connectionId && (
            <TabsTrigger value="sponsor" className="relative">
              Sponsor
              {hasUnreadMessages && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
            </TabsTrigger>
          )}

          <TabsTrigger value="discovery">Discovery</TabsTrigger>
        </TabsList>

        {[1, 2, 3].map(stageNum => (
          <TabsContent key={stageNum} value={`stage-${stageNum}`}>
            <Card>
              <CardHeader>
                <CardTitle>{getStageTitle(stageNum)}</CardTitle>
                <CardDescription>This is your private memo for this stage. Use the prompts above to guide your reflection.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TiptapEditor
                  content={stageMemos.get(stageNum) || ''}
                  onChange={(html) => setStageMemos(new Map(stageMemos.set(stageNum, html)))}
                />
                <div className="flex justify-end items-center gap-4">
                  <Button onClick={() => handleSaveMemo(stageNum)}>Save Memo (Draft)</Button>
                  {connectionId && (
                    <Button variant="outline" onClick={() => handleUpdateSponsor(stageNum)}>
                      Update Sponsor
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
        
        <TabsContent value="journal">
          <Card>
            <CardHeader>
              <CardTitle>General Journal</CardTitle>
              <CardDescription>Your private, daily journal entries. Not specific to any virtue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 border p-4 rounded-md bg-gray-100">
                {journalEntries.length > 0 ? journalEntries.map(entry => (
                  <div key={entry.id} className="p-3 bg-white rounded-md shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">{new Date(entry.created_at).toLocaleString()}</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{entry.entry_text}</p>
                  </div>
                )) : (
                  <Alert variant="default">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Entries Yet</AlertTitle>
                    <AlertDescription>Your journal entries will appear here once saved.</AlertDescription>
                  </Alert>
                )}
              </div>
              <Textarea 
                className="min-h-[150px] bg-white font-serif"
                placeholder="What's on your mind today?"
                value={newJournalEntry}
                onChange={(e) => setNewJournalEntry(e.target.value)}
              />
              <div className="flex justify-end items-center gap-4">
                <Button onClick={handleSaveJournal}>Save Entry</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsor">
          <Card>
            <CardHeader>
              <CardTitle>Sponsor Communication</CardTitle>
              <CardDescription>Connect with your sponsor here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionId ? (
                <>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 border p-4 rounded-md bg-gray-100 flex flex-col">
                    {chatMessages.length > 0 ? chatMessages.map(message => (
                      <div 
                        key={message.id} 
                        className={`p-3 rounded-lg shadow-sm flex flex-col ${
                          message.sender_id === currentUserId 
                            ? 'bg-blue-500 text-white self-end' 
                            : 'bg-white text-gray-800 self-start'
                        } max-w-[70%]`}
                      >
                        <p className={`text-xs mb-1 ${
                            message.sender_id === currentUserId ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          <strong>{message.sender_name || 'Unknown'}</strong> - {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                        <p className="whitespace-pre-wrap">{message.message_text}</p>
                      </div>
                    )) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Messages Yet</AlertTitle>
                        <AlertDescription>Start a conversation with your sponsor.</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Textarea
                      className="flex-grow bg-white"
                      placeholder="Type your message..."
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChatMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendChatMessage} size="icon" className="flex-shrink-0">
                      <Send size={18} />
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Sponsor Connection</AlertTitle>
                  <AlertDescription>
                    You need an active sponsor connection to use this feature. <Link href="/sponsor" className="font-bold underline">Go to the Sponsor page to invite one.</Link>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discovery">
          <Card>
            <CardHeader><CardTitle>About {virtue.name}</CardTitle></CardHeader>
            <CardContent className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(virtue.description) }} />
              <h3>Author&apos;s Reflection</h3>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(virtue.author_reflection || '<em>No reflection available.</em>') }} />
              <h3>Story of Virtue</h3>
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(virtue.story_of_virtue || '<em>No story available.</em>') }} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
