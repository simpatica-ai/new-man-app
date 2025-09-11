'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Send, CheckCircle, Edit, Lightbulb, ChevronRight, ChevronLeft, GripHorizontal, HelpCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TiptapEditor from '@/components/Editor'
import JournalComponent from '@/components/JournalComponent'
import AppHeader from '@/components/AppHeader'
import VirtueGuideModal from '@/components/VirtueGuideModal'

// --- Helper Functions ---
const generateMemoHash = (memos: Map<number, string>, stageNumber: number) => {
  const relevantMemos = [];
  for (let i = 1; i <= stageNumber; i++) {
    relevantMemos.push(memos.get(i) || '');
  }
  return btoa(relevantMemos.join('|')); // Simple base64 hash
};

// --- Type Definitions ---
type Prompt = { id: number; prompt_text: string }
type Affirmation = { id: number; text: string }
type Stage = { 
  id: number; 
  stage_number: number; 
  title: string | null; 
  stage_prompts: Prompt[];
}
type Virtue = { 
  id: number; 
  name: string; 
  description: string | null; 
  story_of_virtue: string | null; 
  author_reflection: string | null; 
  virtue_stages: Stage[];
  affirmations: Affirmation[];
}
type ChatMessage = { id: number; sender_id: string; message_text: string; created_at: string; sender_name: string | null; read_at: string | null }
type StageStatus = 'not_started' | 'in_progress' | 'completed';

// --- Standalone StageContent Component for Performance ---
const StageContent = ({ stage, memoContent, status, onMemoChange, onSaveMemo, onCompleteStage, onEditStage, writingPanelHeight, setWritingPanelHeight }: { 
  stage: Stage, 
  memoContent: string, 
  status: StageStatus,
  onMemoChange: (html: string) => void,
  onSaveMemo: () => Promise<void>,
  onCompleteStage: () => Promise<void>,
  onEditStage: () => Promise<void>,
  writingPanelHeight: number,
  setWritingPanelHeight: (height: number) => void
}) => {
    const [isSaving, setIsSaving] = useState(false);
    
    const empatheticTitles: { [key: number]: string } = {
      1: "My Private Reflection for Stage 1: Gently Exploring Areas for Growth",
      2: "My Private Reflection for Stage 2: Building New, Healthy Habits",
      3: "My Private Reflection for Stage 3: Maintaining Your Progress with Grace"
    };
    const cardTitle = empatheticTitles[stage.stage_number] || `My Private Reflection for ${stage.title}`;

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
            return (
              <Badge variant="secondary" className="bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle size={14} className="mr-1" />
                Completed
              </Badge>
            )
        }
        if (status === 'in_progress') {
            return (
              <Badge variant="secondary" className="bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200">
                <Edit size={14} className="mr-1" />
                In Progress
              </Badge>
            )
        }
        return null;
    }

    return (
      <Card className="mt-6 border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-stone-800 font-medium text-xl leading-relaxed">{cardTitle}</CardTitle>
              <CardDescription className="text-stone-600">Use the guidance above to reflect deeply. Your thoughts here remain private and secure.</CardDescription>
            </div>
            <StatusBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-stone-200/60 p-1 relative">
            <TiptapEditor
              content={memoContent}
              onChange={onMemoChange}
              height={writingPanelHeight}
            />
            <div 
              className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex items-center justify-center bg-stone-100/50 hover:bg-stone-200/50 transition-colors group"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const startHeight = writingPanelHeight;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const deltaY = e.clientY - startY;
                  const newHeight = Math.max(200, Math.min(800, startHeight + deltaY));
                  setWritingPanelHeight(newHeight);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <GripHorizontal className="h-3 w-3 text-stone-400 group-hover:text-stone-600" />
            </div>
          </div>
          <div className="flex justify-end items-center gap-3 pt-2">
            {status === 'completed' ? (
              <Button 
                variant="outline" 
                onClick={onEditStage}
                className="border-amber-200 text-amber-800 hover:bg-amber-50 transition-mindful"
              >
                Edit Completed Reflection
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="border-stone-300 text-stone-700 hover:bg-stone-50 transition-mindful"
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={isSaving}
                  className="bg-gradient-primary text-primary-foreground hover:opacity-90 transition-mindful shadow-contemplative"
                >
                  {isSaving ? 'Saving...' : 'Mark Complete'}
                </Button>
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
  const [defectAnalysis, setDefectAnalysis] = useState<{analysis_text: string | null} | null>(null)
  const [stage1AiPrompt, setStage1AiPrompt] = useState<string | null>(null)
  const [stage2AiPrompt, setStage2AiPrompt] = useState<string | null>(null)
  const [stage3AiPrompt, setStage3AiPrompt] = useState<string | null>(null)
  const [isPromptLoading, setIsPromptLoading] = useState(false)
  const [isPromptHidden, setIsPromptHidden] = useState(false)
  const [writingPanelHeight, setWritingPanelHeight] = useState(400)
  const [showGuideModal, setShowGuideModal] = useState(false)


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
      const virtuePromise = supabase.from('virtues').select('*, virtue_stages(*, stage_prompts(*)), affirmations(*)').eq('id', parseInt(virtueId as string)).single();
      const memosPromise = supabase.from('user_virtue_stage_memos').select('stage_number, memo_text').eq('user_id', user.id).eq('virtue_id', parseInt(virtueId as string));
      const progressPromise = supabase.from('user_virtue_stage_progress').select('stage_number, status').eq('user_id', user.id).eq('virtue_id', parseInt(virtueId as string));
      const connectionPromise = supabase.from('sponsor_connections').select('id').or(`practitioner_user_id.eq.${user.id},sponsor_user_id.eq.${user.id}`).eq('status', 'active').maybeSingle();
      const defectAnalysisPromise = supabase.from('virtue_analysis').select('*').eq('user_id', user.id).eq('virtue_id', parseInt(virtueId as string)).single();

      const [virtueResult, memosResult, progressResult, connectionResult, defectAnalysisResult] = await Promise.all([virtuePromise, memosPromise, progressPromise, connectionPromise, defectAnalysisPromise]);

      if (virtueResult.error) throw virtueResult.error;
      if (virtueResult.data) {
        virtueResult.data.virtue_stages.sort((a, b) => a.stage_number - b.stage_number);
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

  useEffect(() => {
    const guideKey = 'virtue-guide-seen'
    const seen = localStorage.getItem(guideKey)
    if (!seen) {
      setShowGuideModal(true)
    }

  }, [])

  const handleCloseGuide = () => {
    const guideKey = 'virtue-guide-seen'
    localStorage.setItem(guideKey, 'true')
    setShowGuideModal(false)

  }

  const fetchStage1Prompt = useCallback(async () => {
    if (!virtue || !defectAnalysis || !currentUserId) return;

    setIsPromptLoading(true);
    try {
      const memoHash = generateMemoHash(memos, 1);
      
      // Check cache first
      const { data: cachedPrompt } = await supabase
        .from('user_virtue_ai_prompts')
        .select('prompt_text, memo_hash')
        .eq('user_id', currentUserId)
        .eq('virtue_id', virtue.id)
        .eq('stage_number', 1)
        .single();

      if (cachedPrompt && cachedPrompt.memo_hash === memoHash) {
        setStage1AiPrompt(cachedPrompt.prompt_text);
        return;
      }

      // Generate new prompt
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

      if (!response.ok) throw new Error('Failed to fetch Stage 1 prompt');
      const data = await response.json();
      
      // Cache the new prompt
      await supabase.from('user_virtue_ai_prompts').upsert({
        user_id: currentUserId,
        virtue_id: virtue.id,
        stage_number: 1,
        prompt_text: data.prompt,
        memo_hash: memoHash
      });
      
      setStage1AiPrompt(data.prompt);

    } catch (error) {
      console.error("Error fetching Stage 1 prompt:", error);
      setStage1AiPrompt("Could not load guidance. Please try reloading.");
    } finally {
      setIsPromptLoading(false);
    }
  }, [virtue, defectAnalysis, memos, currentUserId]);

  const fetchStage2Prompt = useCallback(async () => {
    if (!virtue || !defectAnalysis || !currentUserId) return;

    setIsPromptLoading(true);
    try {
      const stage1Status = progress.get(`${virtueId}-1`);
      const memoHash = generateMemoHash(memos, 2) + `|${stage1Status}`;
      
      // Check cache first
      const { data: cachedPrompt } = await supabase
        .from('user_virtue_ai_prompts')
        .select('prompt_text, memo_hash')
        .eq('user_id', currentUserId)
        .eq('virtue_id', virtue.id)
        .eq('stage_number', 2)
        .single();

      if (cachedPrompt && cachedPrompt.memo_hash === memoHash) {
        setStage2AiPrompt(cachedPrompt.prompt_text);
        return;
      }

      // Generate new prompt
      const response = await fetch('https://getstage2-917009769018.us-central1.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtueName: virtue.name,
          virtueDef: virtue.description,
          characterDefectAnalysis: defectAnalysis.analysis_text,
          stage1MemoContent: memos.get(1) || '',
          stage2MemoContent: memos.get(2) || '',
          stage1Complete: stage1Status === 'completed'
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch Stage 2 prompt');
      const data = await response.json();
      
      // Cache the new prompt
      await supabase.from('user_virtue_ai_prompts').upsert({
        user_id: currentUserId,
        virtue_id: virtue.id,
        stage_number: 2,
        prompt_text: data.prompt,
        memo_hash: memoHash
      });
      
      setStage2AiPrompt(data.prompt);

    } catch (error) {
      console.error("Error fetching Stage 2 prompt:", error);
      setStage2AiPrompt("Could not load guidance. Please try reloading.");
    } finally {
      setIsPromptLoading(false);
    }
  }, [virtue, defectAnalysis, memos, progress, virtueId, currentUserId]);

  const fetchStage3Prompt = useCallback(async () => {
    if (!virtue || !defectAnalysis || !currentUserId) return;

    setIsPromptLoading(true);
    try {
      const stage1Status = progress.get(`${virtueId}-1`);
      const stage2Status = progress.get(`${virtueId}-2`);
      const memoHash = generateMemoHash(memos, 3) + `|${stage1Status}|${stage2Status}`;
      
      // Check cache first
      const { data: cachedPrompt } = await supabase
        .from('user_virtue_ai_prompts')
        .select('prompt_text, memo_hash')
        .eq('user_id', currentUserId)
        .eq('virtue_id', virtue.id)
        .eq('stage_number', 3)
        .single();

      if (cachedPrompt && cachedPrompt.memo_hash === memoHash) {
        setStage3AiPrompt(cachedPrompt.prompt_text);
        return;
      }

      // Generate new prompt
      const response = await fetch('https://getstage3-917009769018.us-central1.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          virtueName: virtue.name,
          virtueDef: virtue.description,
          characterDefectAnalysis: defectAnalysis.analysis_text,
          stage1MemoContent: memos.get(1) || '',
          stage2MemoContent: memos.get(2) || '',
          stage3MemoContent: memos.get(3) || '',
          stage1Complete: stage1Status === 'completed',
          stage2Complete: stage2Status === 'completed'
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch Stage 3 prompt');
      const data = await response.json();
      
      // Cache the new prompt
      await supabase.from('user_virtue_ai_prompts').upsert({
        user_id: currentUserId,
        virtue_id: virtue.id,
        stage_number: 3,
        prompt_text: data.prompt,
        memo_hash: memoHash
      });
      
      setStage3AiPrompt(data.prompt);

    } catch (error) {
      console.error("Error fetching Stage 3 prompt:", error);
      setStage3AiPrompt("Could not load guidance. Please try reloading.");
    } finally {
      setIsPromptLoading(false);
    }
  }, [virtue, defectAnalysis, memos, progress, virtueId, currentUserId]);

  useEffect(() => {
    if (virtue && defectAnalysis && progress.size > 0) {
      if (displayedStageNumber === 1) {
        fetchStage1Prompt();
      } else if (displayedStageNumber === 2) {
        fetchStage2Prompt();
      } else if (displayedStageNumber === 3) {
        fetchStage3Prompt();
      }
    }
  }, [displayedStageNumber, virtue, defectAnalysis, progress, fetchStage1Prompt, fetchStage2Prompt, fetchStage3Prompt]);

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
    } else if (stageNumber === 2) {
      fetchStage2Prompt();
    } else if (stageNumber === 3) {
      fetchStage3Prompt();
    }
  }

  const handleCompleteStage = async (stageNumber: number) => {
    if (!virtue) return;
    const { error } = await updateStageStatus(stageNumber, 'completed');
    if (error) console.error("Error completing stage:", error.message);
    await fetchPageData();
    
    // Refresh prompts for subsequent stages when a stage is completed
    setTimeout(() => {
      if (stageNumber === 1 && displayedStageNumber === 2) {
        fetchStage2Prompt();
      } else if (stageNumber === 2 && displayedStageNumber === 3) {
        fetchStage3Prompt();
      }
    }, 500);
  };
  
  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !currentUserId || !connectionId) return;

    const { data: newMessage, error } = await supabase
      .from('sponsor_chat_messages')
      .insert({
        connection_id: connectionId,
        sender_id: currentUserId,
        receiver_id: parseInt(virtueId as string),
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
  

  
  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    if (tabValue.startsWith('stage-')) {
      setDisplayedStageNumber(parseInt(tabValue.split('-')[1]));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      <AppHeader />
      <div className="p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-amber-200/60 rounded-lg w-64 mx-auto"></div>
          <div className="h-4 bg-stone-300/60 rounded-lg w-48 mx-auto"></div>
        </div>
      </div>
    </div>
  )
  if (!virtue) return (
     <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      <AppHeader />
      <div className="p-8 text-center">
        <div className="text-stone-600 font-light">Virtue not found.</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/60 to-stone-100/80"></div>
      
      <div className="relative z-10">
        <AppHeader />
        <main className="container mx-auto p-4 md:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-stone-800 leading-tight">
                  {virtue.name} 
                  <span className="block text-xl font-medium text-amber-900 mt-1">Workspace</span>
                </h1>
                <div className="w-24 h-0.5 bg-gradient-to-r from-amber-600 to-stone-600 mt-3"></div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuideModal(true)}
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Guide
              </Button>
            </div>
          </div>

          {/* Dynamic Layout Grid */}
          <div className={`grid gap-8 items-start transition-all duration-500 ease-in-out ${
            isPromptHidden ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-5'
          }`}>
            {/* Main Content */}
            <div className={`transition-all duration-500 ease-in-out ${
              isPromptHidden ? 'lg:col-span-1' : 'lg:col-span-3'
            }`}>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className={`grid w-full gap-2 bg-white/70 backdrop-blur-sm border border-stone-200/60 ${connectionId ? 'grid-cols-5' : 'grid-cols-4'}`}>
                  <TabsTrigger 
                    value="stage-1" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-stone-100 data-[state=active]:text-stone-800 data-[state=active]:border-amber-200 transition-mindful flex flex-col py-3 h-auto"
                  >
                    <span className="text-sm font-medium">Stage 1</span>
                    <span className="text-sm text-stone-600">Dismantling</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stage-2"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-stone-100 data-[state=active]:text-stone-800 data-[state=active]:border-amber-200 transition-mindful flex flex-col py-3 h-auto"
                  >
                    <span className="text-sm font-medium">Stage 2</span>
                    <span className="text-sm text-stone-600">Building</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stage-3"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-stone-100 data-[state=active]:text-stone-800 data-[state=active]:border-amber-200 transition-mindful flex flex-col py-3 h-auto"
                  >
                    <span className="text-sm font-medium">Stage 3</span>
                    <span className="text-sm text-stone-600">Maintaining</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="journal"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-stone-100 data-[state=active]:text-stone-800 data-[state=active]:border-amber-200 transition-mindful text-sm"
                  >
                    Journal
                  </TabsTrigger>
                  {connectionId && (
                    <TabsTrigger 
                      value="chat" 
                      className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-100 data-[state=active]:to-stone-100 data-[state=active]:text-stone-800 data-[state=active]:border-amber-200 transition-mindful text-sm"
                    >
                      Sponsor Chat
                      {hasUnreadMessages && (<span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />)}
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
                            writingPanelHeight={writingPanelHeight}
                            setWritingPanelHeight={setWritingPanelHeight}
                          />
                        }
                      </TabsContent>
                  )
                })}
                
                <TabsContent value="journal">
                  <Card className="mt-6 border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle">
                    <CardContent className="pt-6">
                      <JournalComponent />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="chat">
                  <Card className="mt-6 border-stone-200 bg-gradient-to-br from-card via-amber-50/30 to-stone-50 shadow-gentle">
                    <CardHeader>
                      <CardTitle className="text-stone-800 font-medium">Chat with your Sponsor</CardTitle>
                      <CardDescription className="text-stone-600">Connect with your mentor for guidance and support</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 border border-stone-200/60 p-4 rounded-lg bg-white/40 backdrop-blur-sm flex flex-col">
                        {chatMessages.length > 0 ? chatMessages.map(message => (
                          <div key={message.id} className={`p-3 rounded-lg shadow-gentle flex flex-col transition-mindful ${ message.sender_id === currentUserId ? 'bg-gradient-to-br from-stone-600 to-stone-700 text-white self-end' : 'bg-white/80 backdrop-blur-sm text-stone-800 self-start border border-stone-200/60' } max-w-[70%]`}>
                            <p className={`text-xs mb-1 ${ message.sender_id === currentUserId ? 'text-stone-200' : 'text-stone-500' }`}>
                              <strong>{message.sender_name}</strong> - {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                            <p className="whitespace-pre-wrap">{message.message_text}</p>
                          </div>
                        )) : (
                          <Alert className="border-amber-200 bg-amber-50/60 backdrop-blur-sm">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800">No Messages Yet</AlertTitle>
                            <AlertDescription className="text-amber-700">Start the conversation with a thoughtful message.</AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Textarea 
                          className="flex-grow bg-white/60 backdrop-blur-sm border-stone-200/60 transition-mindful focus:bg-white/80" 
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
                        <Button 
                          onClick={handleSendChatMessage} 
                          size="icon" 
                          className="flex-shrink-0 bg-gradient-primary text-primary-foreground hover:opacity-90 transition-mindful shadow-contemplative"
                        >
                          <Send size={18} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Guidance Panel - Collapsible Sideways */}
            {!isPromptHidden && (displayedStageNumber === 1 || displayedStageNumber === 2 || displayedStageNumber === 3) && (
              <div className={`transition-all duration-500 ease-in-out ${
                isPromptHidden ? 'lg:col-span-0' : 'lg:col-span-2'
              } lg:sticky lg:top-24`}>
                <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50 via-stone-50/50 to-amber-50 shadow-lg backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:16px_16px]"></div>
                  </div>

                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <div className="flex items-center gap-4">
                      <Lightbulb className="h-6 w-6 text-amber-700 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-stone-800 font-light text-base">Guided Reflection</CardTitle>
                        <CardDescription className="text-stone-600 font-light text-sm">
                          {displayedStageNumber === 1 && "Stage 1: Dismantling"}
                          {displayedStageNumber === 2 && "Stage 2: Building"}
                          {displayedStageNumber === 3 && "Stage 3: Maintaining"}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPromptHidden(true)}
                      className="text-stone-500 hover:text-stone-700 hover:bg-stone-100/60"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-0 relative">
                    {isPromptLoading ? (
                      <div className="space-y-3">
                        <div className="animate-pulse space-y-2">
                          <div className="h-3 bg-stone-300/40 rounded w-full"></div>
                          <div className="h-3 bg-stone-300/40 rounded w-5/6"></div>
                          <div className="h-3 bg-stone-300/40 rounded w-4/6"></div>
                        </div>
                        <p className="text-stone-600 text-xs font-light animate-pulse">
                          Generating your personalized guidance...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {displayedStageNumber === 1 && stage1AiPrompt && (
                          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3 border border-stone-200/60 shadow-inner">
                            <div className="text-sm text-stone-700 leading-relaxed prose prose-sm prose-stone max-w-none">
                              {stage1AiPrompt.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">
                                  {line.split(/\*\*(.*?)\*\*|\*(.*?)\*/).map((part, j) => {
                                    if (j % 3 === 1) return <strong key={j}>{part}</strong>;
                                    if (j % 3 === 2) return <em key={j}>{part}</em>;
                                    return part;
                                  })}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {displayedStageNumber === 2 && stage2AiPrompt && (
                          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3 border border-stone-200/60 shadow-inner">
                            <div className="text-sm text-stone-700 leading-relaxed prose prose-sm prose-stone max-w-none">
                              {stage2AiPrompt.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">
                                  {line.split(/\*\*(.*?)\*\*|\*(.*?)\*/).map((part, j) => {
                                    if (j % 3 === 1) return <strong key={j}>{part}</strong>;
                                    if (j % 3 === 2) return <em key={j}>{part}</em>;
                                    return part;
                                  })}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {displayedStageNumber === 3 && stage3AiPrompt && (
                          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3 border border-stone-200/60 shadow-inner">
                            <div className="text-sm text-stone-700 leading-relaxed prose prose-sm prose-stone max-w-none">
                              {stage3AiPrompt.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">
                                  {line.split(/\*\*(.*?)\*\*|\*(.*?)\*/).map((part, j) => {
                                    if (j % 3 === 1) return <strong key={j}>{part}</strong>;
                                    if (j % 3 === 2) return <em key={j}>{part}</em>;
                                    return part;
                                  })}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Show Guidance Button - when hidden */}
            {isPromptHidden && (displayedStageNumber === 1 || displayedStageNumber === 2 || displayedStageNumber === 3) && (
              <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-20">
                <Button
                  onClick={() => setIsPromptHidden(false)}
                  className="bg-gradient-to-r from-amber-600 to-stone-600 hover:from-amber-700 hover:to-stone-700 text-white shadow-lg backdrop-blur-sm border border-amber-300/60 rounded-l-full pr-6 pl-4 py-8 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="font-light text-sm">Show Guidance</span>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <VirtueGuideModal 
        isOpen={showGuideModal} 
        onClose={handleCloseGuide}
        hasConnection={!!connectionId}
      />
    </div>
  )
}