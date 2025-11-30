'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Send, AlertCircle, MessageCircle, Users, ChevronDown, HelpCircle, BookOpen } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

import ProgressLegend from '@/components/dashboard/ProgressLegend';
import DOMPurify from 'dompurify';
import Link from 'next/link';

// --- Type Definitions ---
type PractitionerProfile = {
  id: string;
  full_name: string | null;
  last_activity?: string | null;
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
  description?: string;
  practitioner_progress?: Array<{
    current_stage: number;
    completed_stages: number[];
  }>;
};

type ChatMessage = { 
  id: number; 
  sender_id: string; 
  message_text: string; 
  created_at: string; 
  sender_name: string | null 
};

type SelectedMemo = SharedMemo & { virtue_name: string };

export default function CoachDesktop() {
  const [loading, setLoading] = useState(true);
  const [practitioners, setPractitioners] = useState<PractitionerProfile[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<PractitionerProfile | null>(null);
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [sharedMemos, setSharedMemos] = useState<SharedMemo[]>([]);
  const [selectedMemo, setSelectedMemo] = useState<SelectedMemo | null>(null);
  const [selectedVirtue, setSelectedVirtue] = useState<Virtue | null>(null);
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);


  const params = useParams();
  const router = useRouter();
  const organizationSlug = params.organizationSlug as string;

  useEffect(() => {
    document.title = "Coach Desktop";
    console.log('🚀 Coach Desktop component mounted');
    console.log('Organization slug:', organizationSlug);
  }, [organizationSlug]);

  // Effect to handle localStorage after component mounts
  useEffect(() => {
    console.log('💾 localStorage effect triggered');
    console.log('Practitioners length:', practitioners.length);
    console.log('Selected practitioner:', selectedPractitioner);
    
    if (practitioners.length > 0 && !selectedPractitioner) {
      try {
        const storedPractitionerId = typeof window !== 'undefined' ? localStorage.getItem('selectedPractitionerId') : null;
        console.log('🔍 Checking localStorage for practitioner:', storedPractitionerId);
        
        if (storedPractitionerId) {
          const storedPractitioner = practitioners.find(p => p.id === storedPractitionerId);
          if (storedPractitioner) {
            console.log('Found and selecting stored practitioner:', storedPractitioner);
            setSelectedPractitioner(storedPractitioner);
          } else {
            console.log('Stored practitioner not found, selecting first:', practitioners[0]);
            setSelectedPractitioner(practitioners[0]);
          }
        } else {
          console.log('No stored practitioner, selecting first:', practitioners[0]);
          setSelectedPractitioner(practitioners[0]);
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        if (practitioners.length > 0) {
          setSelectedPractitioner(practitioners[0]);
        }
      }
    }
  }, [practitioners, selectedPractitioner]);

  const loadPractitioners = useCallback(async () => {
    console.log('📋 loadPractitioners called with organizationSlug:', organizationSlug);
    if (!organizationSlug) {
      console.log('❌ No organization slug, returning');
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Getting user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found, redirecting to home');
        router.push('/');
        return;
      }
      console.log('✅ User found:', user.id);
      setCurrentUserId(user.id);

      // Verify organization access
      console.log('🏢 Checking organization access for slug:', organizationSlug);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', organizationSlug)
        .single();

      if (orgError || !orgData) {
        console.error('❌ Organization not found:', orgError);
        router.push('/');
        return;
      }
      console.log('✅ Organization found:', orgData);

      // Get practitioners in this organization (temporary - should use assignments later)
      console.log('👥 Fetching all practitioners in organization:', orgData.id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, last_activity')
        .eq('organization_id', orgData.id)
        .contains('roles', ['org-practitioner']);

      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        return;
      }
      console.log('👤 Profiles fetched:', profiles);

      const practitionerList = profiles?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        last_activity: profile.last_activity
      })) || [];

      console.log('✅ Loaded practitioners:', practitionerList);
      console.log('📊 Practitioners count:', practitionerList.length);
      setPractitioners(practitionerList);

    } catch (error) {
      console.error("❌ Error loading practitioners:", error);
    } finally {
      console.log('🏁 loadPractitioners finished, setting loading to false');
      setLoading(false);
    }
  }, [organizationSlug, router, selectedPractitioner]);

  const loadPractitionerData = useCallback(async (practitioner: PractitionerProfile) => {
    console.log('📊 loadPractitionerData called for:', practitioner?.full_name);
    console.log('Current user ID:', currentUserId);
    
    if (!practitioner || !currentUserId) {
      console.log('❌ Missing practitioner or currentUserId');
      return;
    }

    try {
      // Check if coaching tables exist by trying a simple query first
      const { error: tableCheckError } = await supabase
        .from('sponsor_connections')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (tableCheckError) {
        console.warn('⚠️ Issue accessing coaching tables:', {
          code: tableCheckError.code,
          message: tableCheckError.message,
          details: tableCheckError.details
        });
        
        if (tableCheckError.code === '42P01') {
          console.warn('💡 Table does not exist. Run: PRODUCTION_MIGRATION_COACHING_TABLES.sql');
        } else if (tableCheckError.code === '42501') {
          console.warn('💡 Permission denied. Check RLS policies for sponsor_connections table.');
        }
        
        // Still load virtues, but skip coaching-specific data
        const { data: virtuesData, error: virtuesError } = await supabase
          .from('virtues')
          .select('id, name')
          .order('id');
        
        if (virtuesError) throw virtuesError;
        setVirtues(virtuesData || []);
        setSharedMemos([]);
        setUnreadCount(0);
        setConnectionId(null);
        setChatMessages([]);
        return;
      }

      const virtuesPromise = supabase.from('virtues').select('id, name').order('id');
      const memosPromise = supabase.from('sponsor_visible_memos').select('*').eq('user_id', practitioner.id);
      const connectionPromise = supabase.from('sponsor_connections').select('id').eq('practitioner_user_id', practitioner.id).eq('sponsor_user_id', currentUserId).eq('status', 'active').maybeSingle();

      const [virtuesResult, memosResult, connectionResult] = await Promise.all([
        virtuesPromise, memosPromise, connectionPromise
      ]);

      if (virtuesResult.error) throw virtuesResult.error;
      const baseVirtues = virtuesResult.data || [];

      if (memosResult.error) throw memosResult.error;
      const memos = memosResult.data || [];
      setSharedMemos(memos);
      
      // Count unread memos
      const unread = memos.filter(m => !m.sponsor_read_at || new Date(m.practitioner_updated_at) > new Date(m.sponsor_read_at)).length;
      setUnreadCount(unread);
      
      setVirtues(baseVirtues);

      // Handle connection - create if doesn't exist
      let connId = null;
      if (connectionResult.error || !connectionResult.data) {
        // No connection exists, create one automatically
        console.log('🔗 No connection found, creating new connection...');
        try {
          // First verify both users exist in auth.users table
          const { data: authUsers, error: authCheckError } = await supabase
            .from('auth.users')
            .select('id')
            .in('id', [practitioner.id, currentUserId]);
          
          if (authCheckError) {
            console.warn('⚠️ Cannot verify auth users:', authCheckError);
          } else {
            const foundIds = authUsers?.map(u => u.id) || [];
            const missingIds = [practitioner.id, currentUserId].filter(id => !foundIds.includes(id));
            
            if (missingIds.length > 0) {
              console.warn('⚠️ Missing users in auth.users table:', missingIds);
              console.warn('💡 These users exist in profiles but not in auth.users - coaching features disabled');
              setConnectionId(null);
              setChatMessages([]);
              return;
            }
          }
          
          // First try using the helper function from the coaching migration
          let connectionResult, createError;
          
          try {
            const rpcResult = await supabase
              .rpc('create_coach_connection', {
                practitioner_id: practitioner.id,
                coach_id: currentUserId
              });
            connectionResult = rpcResult.data;
            createError = rpcResult.error;
          } catch (rpcError) {
            // If RPC function doesn't exist, fall back to direct insert
            console.log('🔄 RPC function not available, trying direct insert...');
            
            const insertResult = await supabase
              .from('sponsor_connections')
              .insert({
                practitioner_user_id: practitioner.id,
                sponsor_user_id: currentUserId,
                status: 'active'
              })
              .select('id')
              .single();
            
            // Transform direct insert result to match RPC format
            if (insertResult.error) {
              createError = insertResult.error;
              connectionResult = null;
            } else {
              connectionResult = [{
                success: true,
                message: 'Connection created successfully',
                connection_id: insertResult.data.id
              }];
              createError = null;
            }
          }
          
          if (createError) {
            console.error('❌ Error creating connection:', {
              error: createError,
              message: createError.message,
              details: createError.details,
              hint: createError.hint,
              code: createError.code
            });
            
            // Check specific error types
            if (createError.code === '42883') {
              console.warn('⚠️ create_coach_connection function does not exist. Run the coaching tables migration first.');
            } else if (createError.code === '23503') {
              console.warn('⚠️ Foreign key constraint violation - user does not exist in auth.users table');
              console.warn('💡 This practitioner may only exist in profiles table, not auth.users');
              console.warn(`Practitioner ID: ${practitioner.id}`);
            }
            
            // Don't throw - just disable chat functionality
            setConnectionId(null);
            setChatMessages([]);
          } else if (connectionResult && connectionResult.length > 0) {
            const result = connectionResult[0];
            if (result.success) {
              connId = result.connection_id;
              setConnectionId(connId);
              setChatMessages([]); // New connection, no messages yet
              console.log('✅ Connection created successfully:', connId);
            } else {
              console.error('❌ Function returned error:', result.message);
              setConnectionId(null);
              setChatMessages([]);
            }
          } else {
            console.error('❌ Unexpected function result:', connectionResult);
            setConnectionId(null);
            setChatMessages([]);
          }
        } catch (err) {
          console.error('❌ Unexpected error creating connection:', err);
          setConnectionId(null);
          setChatMessages([]);
        }
      } else {
        connId = connectionResult.data.id;
        setConnectionId(connId);
        console.log('✅ Using existing connection:', connId);
      }

      // Load chat messages if we have a connection
      if (connId) {
        const { data: rawMessages, error: messagesError } = await supabase
          .from('sponsor_chat_messages')
          .select('id, sender_id, message_text, created_at, read_at')
          .eq('connection_id', connId)
          .order('created_at', { ascending: true });
        
        if (messagesError) {
          console.error('❌ Error loading messages:', messagesError);
          setChatMessages([]);
        } else if (rawMessages && rawMessages.length > 0) {
          const senderIds = [...new Set(rawMessages.map(msg => msg.sender_id))];
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', senderIds);
          
          if (profilesError) {
            console.error('❌ Error loading profiles:', profilesError);
            setChatMessages(rawMessages.map(msg => ({ ...msg, sender_name: 'Unknown User' })));
          } else {
            const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));
            const combinedMessages = rawMessages.map(msg => ({ 
              ...msg, 
              sender_name: profileMap.get(msg.sender_id) || 'Unknown User' 
            }));
            setChatMessages(combinedMessages);
          }
        } else {
          setChatMessages([]);
        }
      }

    } catch (error) {
      console.error("Error loading practitioner data:", error);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadPractitioners();
  }, [loadPractitioners]);

  useEffect(() => {
    console.log('🎯 selectedPractitioner effect triggered:', selectedPractitioner?.full_name);
    if (selectedPractitioner) {
      loadPractitionerData(selectedPractitioner);
    }
  }, [selectedPractitioner, loadPractitionerData]);

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
    if (!selectedPractitioner) return;

    const { error } = await supabase
      .from('sponsor_visible_memos')
      .update({ sponsor_read_at: new Date().toISOString() })
      .eq('user_id', selectedPractitioner.id)
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

  const getStatusClasses = (virtue: Virtue) => {
    // This mimics the Dashboard's getStatusClasses function
    // For coaching, we'll show different states based on memo availability and read status
    const hasUnreadMemos = sharedMemos.some(m => 
      m.virtue_id === virtue.id && 
      (!m.sponsor_read_at || new Date(m.practitioner_updated_at) > new Date(m.sponsor_read_at))
    );
    
    const hasMemos = sharedMemos.some(m => m.virtue_id === virtue.id);
    
    if (hasUnreadMemos) {
      return 'border-green-500 bg-green-50/60';
    } else if (hasMemos) {
      return 'border-amber-500 bg-amber-50/60';
    } else {
      return 'border-stone-300 bg-stone-50/60';
    }
  };



  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !currentUserId || !connectionId || !selectedPractitioner) {
      console.log('❌ Cannot send message - missing required data:', {
        hasMessage: !!newChatMessage.trim(),
        hasUserId: !!currentUserId,
        hasConnectionId: !!connectionId,
        hasPractitioner: !!selectedPractitioner
      });
      return;
    }

    try {
      const { data: newMessage, error } = await supabase
        .from('sponsor_chat_messages')
        .insert({ 
          connection_id: connectionId, 
          sender_id: currentUserId, 
          receiver_id: selectedPractitioner.id, 
          message_text: newChatMessage 
        })
        .select('id, sender_id, message_text, created_at, read_at')
        .single();

      if (error) {
        console.error('❌ Error sending message:', error);
        alert("Error sending message: " + error.message);
      } else if (newMessage) {
        const { data: { user } } = await supabase.auth.getUser();
        const senderName = user?.user_metadata.full_name || 'You';
        setChatMessages([...chatMessages, { ...newMessage, sender_name: senderName }]);
        setNewChatMessage("");
        console.log('✅ Message sent successfully');
      }
    } catch (error) {
      console.error('❌ Unexpected error sending message:', error);
      alert("Unexpected error sending message. Please try again.");
    }
  };

  const formatLastActivity = (lastActivity?: string | null) => {
    if (!lastActivity) return 'Never';
    const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days <= 7) return `${days} days ago`;
    return new Date(lastActivity).toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
        </div>
        <div className="relative z-10">
          <AppHeader />
          <main className="container mx-auto p-8">
            <div className="text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-stone-300/60 rounded-lg w-64 mx-auto"></div>
                <div className="h-4 bg-amber-200/60 rounded-lg w-48 mx-auto"></div>
              </div>
              <p className="text-stone-600 font-light mt-4">Loading coach desktop...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(120,113,108)_1px,_transparent_0)] bg-[length:32px_32px]"></div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/60 to-stone-100/80"></div>
      
      <div className="relative z-10">
        <AppHeader />
        <main className="container mx-auto p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-light text-stone-800 leading-tight">
                  Coach Desktop
                </h1>
                <p className="text-stone-600">
                  {selectedPractitioner ? `Coaching ${selectedPractitioner.full_name || 'Practitioner'} on their virtue journey` : 'Select a practitioner to begin coaching'}
                </p>
              </div>
              {practitioners.length > 1 && selectedPractitioner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      <Users className="h-4 w-4 mr-2" />
                      {selectedPractitioner.full_name || 'Practitioner'}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {practitioners.map(practitioner => (
                      <DropdownMenuItem
                        key={practitioner.id}
                        onClick={() => {
                          setSelectedPractitioner(practitioner);
                          try {
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('selectedPractitionerId', practitioner.id);
                              localStorage.setItem('selectedPractitionerName', practitioner.full_name || 'Practitioner');
                            }
                          } catch (error) {
                            console.error('Error saving to localStorage:', error);
                          }
                        }}
                        className={selectedPractitioner?.id === practitioner.id ? 'bg-amber-50' : ''}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{practitioner.full_name || 'Unnamed'}</span>
                          <span className="text-xs text-stone-500">
                            {formatLastActivity(practitioner.last_activity)}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {selectedPractitioner ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel: Summary + Virtue Progress */}
              <div className="lg:col-span-2 space-y-4">
                {/* Practitioner Summary Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle border-l-4 border-l-amber-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-amber-700" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-stone-800">
                            {selectedPractitioner.full_name || 'Practitioner'}
                          </h3>
                          <p className="text-stone-600">Journey Progress</p>
                          {/* Progress Bar */}
                          <div className="mt-2 w-48">
                            <div className="flex justify-between text-xs text-stone-600 mb-1">
                              <span>Progress</span>
                              <span>33%</span>
                            </div>
                            <div className="w-full bg-stone-200 rounded-full h-2">
                              <div className="bg-amber-500 h-2 rounded-full" style={{ width: '33%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-2">
                          Active
                        </Badge>
                        <div className="text-sm text-stone-600">Virtue 5</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 mt-4 pt-4 border-t border-stone-200">
                      <div className="text-center">
                        <div className="text-xs text-stone-600 mb-1">Last Active</div>
                        <div className="font-medium text-stone-800">
                          {formatLastActivity(selectedPractitioner.last_activity)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-stone-600 mb-1">Member Since</div>
                        <div className="font-medium text-stone-800">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-stone-600 mb-1">Current Stage</div>
                        <div className="font-medium text-stone-800">Stage 2</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Virtue Selection and Work Review */}
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <CardTitle className="text-xl font-light text-stone-800">
                        {selectedPractitioner.full_name || 'Practitioner'}'s Virtue Work
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Coaching Guide
                      </Button>
                    </div>
                    
                    {/* Virtue Dropdown */}
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-stone-700">Select Virtue:</label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 min-w-[200px] justify-between">
                            {selectedVirtue ? selectedVirtue.name : 'Choose a virtue...'}
                            <ChevronDown className="h-4 w-4 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80">
                          {virtues.map(virtue => {
                            const unreadCount = sharedMemos.filter(m => 
                              m.virtue_id === virtue.id && 
                              (!m.sponsor_read_at || new Date(m.practitioner_updated_at) > new Date(m.sponsor_read_at))
                            ).length;
                            
                            // Get stage progress for this virtue
                            const stageProgress = [
                              { stage: 1, name: 'Dismantling', color: '#A0522D' },
                              { stage: 2, name: 'Building', color: '#6B8E23' },
                              { stage: 3, name: 'Practicing', color: '#556B2F' }
                            ].map(stageInfo => {
                              const memo = sharedMemos.find(m => m.virtue_id === virtue.id && m.stage_number === stageInfo.stage);
                              const hasUnread = memo && (!memo.sponsor_read_at || new Date(memo.practitioner_updated_at) > new Date(memo.sponsor_read_at));
                              const isCompleted = memo && memo.sponsor_read_at && new Date(memo.practitioner_updated_at) <= new Date(memo.sponsor_read_at);
                              
                              return {
                                ...stageInfo,
                                memo,
                                hasUnread,
                                isCompleted,
                                status: !memo ? 'not-started' : isCompleted ? 'completed' : hasUnread ? 'unread' : 'in-progress'
                              };
                            });
                            
                            return (
                              <DropdownMenuItem
                                key={virtue.id}
                                onClick={() => {
                                  setSelectedVirtue(virtue);
                                  setSelectedStage(1); // Reset to first stage
                                }}
                                className={`${selectedVirtue?.id === virtue.id ? 'bg-amber-50' : ''} p-3`}
                              >
                                <div className="flex flex-col w-full gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-stone-800">{virtue.name}</span>
                                    {unreadCount > 0 && (
                                      <Badge variant="destructive" className="text-xs">
                                        {unreadCount} new
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Stage Progress Icons */}
                                  <div className="flex items-center gap-2">
                                    {stageProgress.map((stage, index) => (
                                      <div key={stage.stage} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                          <div
                                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                              stage.status === 'completed' 
                                                ? 'bg-white border-2' 
                                                : stage.status === 'unread'
                                                ? 'bg-amber-100 border-2 animate-pulse'
                                                : stage.status === 'in-progress'
                                                ? 'bg-amber-50 border-2'
                                                : 'bg-stone-50 border-2 opacity-60'
                                            }`}
                                            style={{
                                              borderColor: stage.color
                                            }}
                                          >
                                            {stage.status === 'completed' ? (
                                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: stage.color }}>
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            ) : stage.status === 'unread' ? (
                                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                            ) : stage.status === 'in-progress' ? (
                                              <span className="text-xs font-bold" style={{ color: stage.color }}>{stage.stage}</span>
                                            ) : (
                                              <span className="text-xs font-bold text-stone-400">{stage.stage}</span>
                                            )}
                                          </div>
                                          <span className="text-xs mt-1 text-center" style={{ color: stage.color, fontSize: '10px' }}>
                                            {stage.name.slice(0, 4)}
                                          </span>
                                        </div>
                                        
                                        {/* Connecting Line */}
                                        {index < 2 && (
                                          <div className="w-4 h-0.5 mx-1 bg-stone-300 relative">
                                            <div 
                                              className="h-full transition-all duration-300"
                                              style={{
                                                backgroundColor: stage.isCompleted ? stage.color : 'transparent',
                                                width: stage.isCompleted ? '100%' : '0%'
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  {selectedVirtue && (
                    <CardContent className="space-y-4">
                      {/* Stage Navigation */}
                      <div className="flex items-center justify-center">
                        <div className="flex items-center bg-stone-100/60 rounded-lg p-1">
                          {[
                            { stage: 1, name: 'Dismantling', color: '#A0522D' },
                            { stage: 2, name: 'Building', color: '#6B8E23' },
                            { stage: 3, name: 'Practicing', color: '#556B2F' }
                          ].map((stageInfo, index) => {
                            const memo = sharedMemos.find(m => m.virtue_id === selectedVirtue.id && m.stage_number === stageInfo.stage);
                            const hasUnread = memo && (!memo.sponsor_read_at || new Date(memo.practitioner_updated_at) > new Date(memo.sponsor_read_at));
                            const isActive = selectedStage === stageInfo.stage;
                            
                            return (
                              <button
                                key={stageInfo.stage}
                                onClick={() => setSelectedStage(stageInfo.stage)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 relative ${
                                  isActive 
                                    ? 'bg-white shadow-sm text-stone-800' 
                                    : 'text-stone-600 hover:text-stone-800 hover:bg-white/50'
                                }`}
                                style={{
                                  borderLeft: isActive ? `3px solid ${stageInfo.color}` : 'none'
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{stageInfo.name}</span>
                                  {hasUnread && (
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  )}
                                  {!memo && (
                                    <div className="w-2 h-2 bg-stone-300 rounded-full"></div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Stage Content */}
                      <div className="min-h-[400px]">
                        {(() => {
                          const memo = sharedMemos.find(m => m.virtue_id === selectedVirtue.id && m.stage_number === selectedStage);
                          const stageInfo = [
                            { stage: 1, name: 'Dismantling', color: '#A0522D' },
                            { stage: 2, name: 'Building', color: '#6B8E23' },
                            { stage: 3, name: 'Practicing', color: '#556B2F' }
                          ].find(s => s.stage === selectedStage);
                          
                          if (!memo) {
                            return (
                              <div className="flex flex-col items-center justify-center h-64 text-center">
                                <BookOpen className="h-12 w-12 text-stone-300 mb-4" />
                                <h3 className="text-lg font-medium text-stone-600 mb-2">
                                  No work submitted for {stageInfo?.name}
                                </h3>
                                <p className="text-stone-500 text-sm">
                                  The practitioner hasn't shared any writing for this stage yet.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-stone-800" style={{ color: stageInfo?.color }}>
                                  {selectedVirtue.name} - {stageInfo?.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={memo.sponsor_read_at ? "secondary" : "default"}
                                    className={memo.sponsor_read_at 
                                      ? "bg-stone-100 text-stone-600" 
                                      : "bg-amber-100 text-amber-800"
                                    }
                                  >
                                    {memo.sponsor_read_at ? 'Read' : 'New'}
                                  </Badge>
                                  <span className="text-xs text-stone-500">
                                    Updated: {new Date(memo.practitioner_updated_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              
                              <div 
                                className="prose prose-stone max-w-none p-6 bg-white/60 backdrop-blur-sm rounded-lg border border-stone-200/60 shadow-inner min-h-[300px]" 
                                dangerouslySetInnerHTML={{ 
                                  __html: DOMPurify.sanitize(memo.memo_text || '<em class="text-stone-500">No content shared.</em>') 
                                }} 
                              />
                              
                              {!memo.sponsor_read_at && (
                                <div className="flex justify-end">
                                  <Button
                                    onClick={() => markMemoAsRead(memo)}
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                  >
                                    Mark as Read
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  )}

                  {!selectedVirtue && (
                    <CardContent>
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <BookOpen className="h-8 w-8 text-stone-400 mb-2" />
                        <p className="text-stone-600">Select a virtue above to review the practitioner's work</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Right Panel: Chat + Shared Memos */}
              <div className="space-y-4">
                {/* Chat Section */}
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-stone-800">
                      <MessageCircle className="h-5 w-5 text-amber-600" />
                      Chat
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {unreadCount}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Chat Messages */}
                    <div className="h-64 overflow-y-auto space-y-3 p-3 bg-stone-50/60 rounded-lg border border-stone-200/60">
                      {chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-stone-500 text-sm">No messages yet. Start a conversation!</p>
                        </div>
                      ) : (
                        chatMessages.map(message => (
                          <div 
                            key={message.id} 
                            className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.sender_id === currentUserId 
                                  ? 'bg-amber-500 text-white' 
                                  : 'bg-white border border-stone-200'
                              }`}
                            >
                              <p className="text-sm">{message.message_text}</p>
                              <p className={`text-xs mt-1 ${
                                message.sender_id === currentUserId ? 'text-amber-100' : 'text-stone-500'
                              }`}>
                                {new Date(message.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <Textarea
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 min-h-[40px] max-h-[120px] resize-none border-stone-300 focus:border-amber-400 focus:ring-amber-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChatMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendChatMessage}
                        disabled={!newChatMessage.trim()}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Shared Memos Section */}
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-stone-800">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                      Shared Reflections
                    </CardTitle>
                    <CardDescription>
                      Recent reflections shared by {selectedPractitioner.full_name || 'the practitioner'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sharedMemos.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                        <p className="text-stone-500 text-sm">No shared reflections yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sharedMemos.slice(0, 5).map((memo, index) => {
                          const virtue = virtues.find(v => v.id === memo.virtue_id);
                          return (
                            <div 
                              key={`${memo.virtue_id}-${memo.stage_number}-${index}`}
                              className="p-3 bg-stone-50/60 rounded-lg border border-stone-200/60 cursor-pointer hover:bg-stone-100/60 transition-colors"
                              onClick={() => setSelectedMemo({
                                ...memo,
                                virtue_name: virtue?.name || 'Unknown Virtue'
                              })}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm text-stone-800">
                                  {virtue?.name || 'Unknown Virtue'} - Stage {memo.stage_number}
                                </span>
                                <Badge 
                                  variant={memo.sponsor_read_at ? "secondary" : "default"}
                                  className={memo.sponsor_read_at 
                                    ? "bg-stone-100 text-stone-600" 
                                    : "bg-amber-100 text-amber-800"
                                  }
                                >
                                  {memo.sponsor_read_at ? 'Read' : 'New'}
                                </Badge>
                              </div>
                              <p className="text-xs text-stone-600 line-clamp-2">
                                {memo.memo_text ? 
                                  DOMPurify.sanitize(memo.memo_text).replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                                  : 'No content'
                                }
                              </p>
                              <p className="text-xs text-stone-500 mt-1">
                                {new Date(memo.practitioner_updated_at).toLocaleDateString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Reports Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                    <HelpCircle className="h-8 w-8 text-amber-700" />
                    <div>
                      <CardTitle className="text-stone-800 font-medium">Reports</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-stone-600 mb-3">
                      Generate detailed progress reports for this practitioner.
                    </p>
                    <div className="space-y-2">
                      <Link href={`/reports/work-product?practitioner_id=${selectedPractitioner.id}`}>
                        <Button size="sm" variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50">
                          Work Product Report
                        </Button>
                      </Link>
                      <Link href={`/reports/progress?practitioner_id=${selectedPractitioner.id}`}>
                        <Button size="sm" variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50">
                          Progress Report
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Memo Detail */}
                {selectedMemo && (
                  <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-stone-800">
                        {selectedMemo.virtue_name} - Stage {selectedMemo.stage_number}
                      </CardTitle>
                      <CardDescription>
                        Shared on {new Date(selectedMemo.practitioner_updated_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="prose prose-sm max-w-none p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-stone-200/60" 
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMemo.memo_text || '<em>No content shared.</em>') }} 
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-stone-200/60 shadow-gentle">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Users className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                  <p className="text-stone-600 font-light">
                    {practitioners.length === 0 
                      ? 'No practitioners assigned to you' 
                      : 'Select a practitioner to begin coaching'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}