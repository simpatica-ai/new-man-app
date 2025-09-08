'use client'

import React from 'react';
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Session } from '@supabase/supabase-js'
import AppHeader from '@/components/AppHeader'
import { Sparkles, Heart, Shield, Users, Target, Clock, Zap, Star, HelpCircle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import VirtueRoseChart from '@/components/VirtueRoseChart'
import ReactMarkdown from 'react-markdown'
import '../print.css'
import { saveAs } from 'file-saver'
import { pdf } from '@react-pdf/renderer'
import VirtueAssessmentPDF from './VirtueAssessmentPDF';
import PrintableVirtueRoseChart from '@/components/PrintableVirtueRoseChart'
import { convertChartToImage } from '@/utils/chartToImage'
import PrintButton from '@/components/PrintButton';

// --- Data & Types ---
const coreVirtuesList = ["Humility", "Honesty", "Gratitude", "Self-Control", "Mindfulness", "Patience", "Integrity", "Compassion", "Healthy Boundaries", "Responsibility", "Vulnerability", "Respect"]
const defects = [
    { name: "Addictive tendencies", virtues: ["Self-Control", "Mindfulness"], icon: <Zap className="h-4 w-4" />, category: "Impulse Control" },
    { name: "Anger", virtues: ["Patience", "Compassion", "Self-Control"], icon: <Zap className="h-4 w-4" />, category: "Emotional Regulation" },
    { name: "Apathy", virtues: ["Compassion", "Responsibility"], icon: <Heart className="h-4 w-4" />, category: "Connection" },
    { name: "Arrogance", virtues: ["Humility", "Respect"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Betrayal", virtues: ["Honesty", "Integrity", "Respect"], icon: <Shield className="h-4 w-4" />, category: "Trust" },
    { name: "Bitterness", virtues: ["Gratitude", "Compassion"], icon: <Heart className="h-4 w-4" />, category: "Emotional Health" },
    { name: "Blaming others", virtues: ["Responsibility", "Honesty"], icon: <Target className="h-4 w-4" />, category: "Accountability" },
    { name: "Boastfulness", virtues: ["Humility"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Close-mindedness", virtues: ["Humility", "Respect"], icon: <Users className="h-4 w-4" />, category: "Openness" },
    { name: "Compulsiveness", virtues: ["Self-Control", "Mindfulness"], icon: <Zap className="h-4 w-4" />, category: "Impulse Control" },
    { name: "Conceit", virtues: ["Humility"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Cruelty", virtues: ["Compassion", "Respect"], icon: <Heart className="h-4 w-4" />, category: "Compassion" },
    { name: "Deceit", virtues: ["Honesty", "Integrity"], icon: <Shield className="h-4 w-4" />, category: "Honesty" },
    { name: "Defensiveness", virtues: ["Humility", "Vulnerability"], icon: <Shield className="h-4 w-4" />, category: "Openness" },
    { name: "Dishonesty", virtues: ["Honesty", "Integrity"], icon: <Shield className="h-4 w-4" />, category: "Honesty" },
    { name: "Disrespect", virtues: ["Respect", "Compassion"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Distrust", virtues: ["Vulnerability", "Honesty"], icon: <Shield className="h-4 w-4" />, category: "Trust" },
    { name: "Egotism", virtues: ["Humility", "Respect"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Haughtiness", virtues: ["Humility", "Respect"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Hypocrisy", virtues: ["Honesty", "Integrity"], icon: <Shield className="h-4 w-4" />, category: "Integrity" },
    { name: "Impatience", virtues: ["Patience", "Mindfulness"], icon: <Clock className="h-4 w-4" />, category: "Patience" },
    { name: "Impulsiveness", virtues: ["Self-Control", "Mindfulness"], icon: <Zap className="h-4 w-4" />, category: "Impulse Control" },
    { name: "Indifference", virtues: ["Compassion", "Responsibility"], icon: <Heart className="h-4 w-4" />, category: "Connection" },
    { name: "Ingratitude", virtues: ["Gratitude"], icon: <Star className="h-4 w-4" />, category: "Appreciation" },
    { name: "Infidelity", virtues: ["Honesty", "Integrity", "Respect"], icon: <Shield className="h-4 w-4" />, category: "Trust" },
    { name: "Intolerance", virtues: ["Respect", "Compassion"], icon: <Users className="h-4 w-4" />, category: "Acceptance" },
    { name: "Irresponsibility", virtues: ["Responsibility"], icon: <Target className="h-4 w-4" />, category: "Accountability" },
    { name: "Judgmental attitude", virtues: ["Compassion", "Respect"], icon: <Heart className="h-4 w-4" />, category: "Acceptance" },
    { name: "Lack of empathy", virtues: ["Compassion"], icon: <Heart className="h-4 w-4" />, category: "Compassion" },
    { name: "Lack of gratitude", virtues: ["Gratitude"], icon: <Star className="h-4 w-4" />, category: "Appreciation" },
    { name: "Lack of self-control", virtues: ["Self-Control", "Mindfulness"], icon: <Zap className="h-4 w-4" />, category: "Impulse Control" },
    { name: "Lying", virtues: ["Honesty", "Integrity"], icon: <Shield className="h-4 w-4" />, category: "Honesty" },
    { name: "Manipulation", virtues: ["Honesty", "Respect", "Integrity"], icon: <Shield className="h-4 w-4" />, category: "Integrity" },
    { name: "Narcissism", virtues: ["Humility", "Compassion"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Neglect", virtues: ["Responsibility", "Compassion"], icon: <Heart className="h-4 w-4" />, category: "Care" },
    { name: "Objectification", virtues: ["Respect", "Compassion"], icon: <Users className="h-4 w-4" />, category: "Respect" },
    { name: "Pride", virtues: ["Humility", "Respect"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Recklessness", virtues: ["Self-Control", "Mindfulness"], icon: <Zap className="h-4 w-4" />, category: "Impulse Control" },
    { name: "Resentment", virtues: ["Gratitude", "Compassion"], icon: <Heart className="h-4 w-4" />, category: "Emotional Health" },
    { name: "Rudeness", virtues: ["Respect", "Compassion"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Self-centeredness", virtues: ["Humility", "Compassion"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Self-righteousness", virtues: ["Humility", "Respect"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Selfishness", virtues: ["Compassion"], icon: <Heart className="h-4 w-4" />, category: "Consideration" },
    { name: "Stealing", virtues: ["Honesty", "Integrity"], icon: <Shield className="h-4 w-4" />, category: "Integrity" },
    { name: "Superiority", virtues: ["Humility", "Respect"], icon: <Users className="h-4 w-4" />, category: "Relationships" },
    { name: "Unreliability", virtues: ["Responsibility", "Integrity"], icon: <Target className="h-4 w-4" />, category: "Accountability" }
];
const harmLevelsMap: { [key: string]: number } = { None: 0, Minimal: 1, Moderate: 2, Significant: 3, Severe: 4 };

type Ratings = { [key: string]: number };
type HarmLevels = { [key: string]: string };
type Result = { 
    virtue: string; 
    priority: number; 
    defectIntensity: number;
};
type VirtueInfo = { id: number; name: string; description: string };
type VirtueAnalysis = { virtue_id: number; analysis_text: string };

// --- DefectRow Component ---
const DefectRow = ({ defect, rating, harmLevel, onRatingChange, onHarmChange }: { 
    defect: { name: string; icon: JSX.Element; category: string };
    rating?: number;
    harmLevel?: string;
    onRatingChange: (name: string, value: string) => void;
    onHarmChange: (name: string, value: string) => void;
}) => (
    <div className="flex flex-col p-3 border border-stone-200 rounded-lg bg-white hover:shadow-sm transition-all duration-200">
        <div className="flex items-start gap-2 mb-2">
            <div className="text-amber-600 mt-0.5">{defect.icon}</div>
            <div className="flex-1">
                <h3 className="font-medium text-stone-800 text-sm leading-tight">{defect.name}</h3>
                <p className="text-xs text-stone-500">{defect.category}</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Frequency</label>
                <RadioGroup 
                    onValueChange={(value) => onRatingChange(defect.name, value)} 
                    value={String(rating || '')} 
                    className="flex items-center justify-between gap-1"
                >
                    {[1,2,3,4,5].map(value => (
                        <div key={value} className="flex flex-col items-center space-y-1 flex-1">
                            <Label htmlFor={`${defect.name}-${value}`} className="text-xs text-stone-500 cursor-pointer text-center">
                                {['Never','Rarely','Sometimes','Often','Always'][value-1]}
                            </Label>
                            <RadioGroupItem 
                                value={String(value)} 
                                id={`${defect.name}-${value}`}
                                className="w-4 h-4 border-2 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 hover:border-amber-400"
                            />
                        </div>
                    ))}
                </RadioGroup>
            </div>
            
            <div>
                <label className="text-xs font-medium text-stone-600 mb-1 block">Impact</label>
                <Select onValueChange={(value) => onHarmChange(defect.name, value)} value={harmLevel || ''}>
                    <SelectTrigger className="w-full bg-white text-xs h-8">
                        <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="Minimal">Minimal</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Significant">Significant</SelectItem>
                        <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    </div>
);

// --- Markdown Renderer Component ---
const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <div className="markdown-content text-sm text-stone-700">
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h2 className="text-lg font-semibold mt-4 mb-2" {...props} />,
          h2: ({node, ...props}) => <h3 className="text-base font-semibold mt-3 mb-1" {...props} />,
          h3: ({node, ...props}) => <h4 className="text-sm font-semibold mt-2 mb-1" {...props} />,
          p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 pl-4" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 pl-4" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
          em: ({node, ...props}) => <em className="italic" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// --- Main Assessment Page Component ---
export default function AssessmentPage() {
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState<Ratings>({});
    const [harmLevels, setHarmLevels] = useState<HarmLevels>({});
    const [results, setResults] = useState<Result[] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [virtueDetails, setVirtueDetails] = useState<VirtueInfo[]>([]);
    const [analyses, setAnalyses] = useState<Map<string, string>>(new Map());
    const [currentAssessmentId, setCurrentAssessmentId] = useState<number | null>(null);
    const [hasExistingAssessment, setHasExistingAssessment] = useState(false);
    const [corsError, setCorsError] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [summaryAnalysis, setSummaryAnalysis] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [userName, setUserName] = useState<string>('');

    const itemsPerPage = 8;

    // Calculate progress
    const answeredCount = Object.keys(ratings).filter(key => ratings[key] !== undefined).length;
    const totalCount = defects.length;
    const progress = Math.round((answeredCount / totalCount) * 100);

    // Pagination
    const currentDefects = defects.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    const totalPages = Math.ceil(defects.length / itemsPerPage);

    // --- AI Analysis Trigger ---
    const triggerAndSaveAnalyses = async (assessmentId: number, user: any, resultsToAnalyze: Result[], ratingsForPrompt: Ratings, harmLevelsForPrompt: HarmLevels) => {
        const ASTRID_AI_URL = "https://get-astrid-analysis-917009769018.us-west1.run.app";

        for (const result of resultsToAnalyze) {
            const virtueInfo = virtueDetails.find(v => v.name === result.virtue);
            if (!virtueInfo) continue;

            const defectDetailsText = formatDefectDetailsForPrompt(result.virtue, ratingsForPrompt, harmLevelsForPrompt);
            const virtueScore = 10 - result.defectIntensity;

            let success = false;
            let retries = 3;
            let corsErrorOccurred = false;
            
            while (!success && retries > 0) {
                try {
                    const response = await fetch(ASTRID_AI_URL, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            virtueName: virtueInfo.name,
                            virtueDef: virtueInfo.description,
                            virtueScore: virtueScore,
                            defectDetails: defectDetailsText
                        })
                    });

                    if (!response.ok) {
                        if (response.status === 0) {
                            corsErrorOccurred = true;
                            setCorsError(true);
                            throw new Error('CORS error: Cannot access the AI service due to cross-origin restrictions');
                        }
                        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                    }

                    const data = await response.json();
                    
                    if (!data.analysis) {
                        throw new Error('No analysis in response');
                    }

                    // Save to database
                    const { error: insertError } = await supabase.from('virtue_analysis').insert({
                        user_id: user.id,
                        assessment_id: assessmentId,
                        virtue_id: virtueInfo.id,
                        analysis_text: data.analysis
                    });

                    if (insertError) {
                        throw new Error(`Database error: ${insertError.message}`);
                    }

                    // Immediately update the local state to reflect the new analysis
                    setAnalyses(prev => {
                        const newMap = new Map(prev);
                        newMap.set(result.virtue, data.analysis);
                        return newMap;
                    });

                    success = true;

                } catch (error) {
                    if (corsErrorOccurred) {
                        break;
                    }
                    
                    retries--;
                    
                    if (retries === 0 || corsErrorOccurred) {
                        // Provide fallback analysis
                        const fallbackAnalysis = generateFallbackAnalysis(virtueInfo, result);
                        
                        // Save fallback to database
                        await supabase.from('virtue_analysis').insert({
                            user_id: user.id,
                            assessment_id: assessmentId,
                            virtue_id: virtueInfo.id,
                            analysis_text: fallbackAnalysis
                        });
                        
                        // Update local state with fallback
                        setAnalyses(prev => {
                            const newMap = new Map(prev);
                            newMap.set(result.virtue, fallbackAnalysis);
                            return newMap;
                        });
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
        }

        // After all virtue analyses are complete, trigger the summary analysis
        await triggerSummaryAnalysis(assessmentId, user, resultsToAnalyze);
    };

    // --- Summary Analysis Trigger ---
    const triggerSummaryAnalysis = async (assessmentId: number, user: any, resultsToAnalyze: Result[]) => {
        setIsGeneratingSummary(true);
        const SUMMARY_AI_URL = "https://get-summary-analysis-917009769018.us-central1.run.app";
        
        try {
            // Prepare data for summary analysis
            const analysesForSummary = Array.from(analyses.entries()).map(([virtue, analysis]) => ({
                virtue,
                analysis
            }));

            const response = await fetch(SUMMARY_AI_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    analyses: analysesForSummary,
                    prioritizedVirtues: resultsToAnalyze
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            
            if (!data.summary) {
                throw new Error('No summary in response');
            }

            // Save to database
            const { error: updateError } = await supabase
                .from('user_assessments')
                .update({ summary_analysis: data.summary })
                .eq('id', assessmentId);

            if (updateError) {
                throw new Error(`Database error: ${updateError.message}`);
            }

            // Update local state
            setSummaryAnalysis(data.summary);

        } catch (error) {
            console.error('Error generating summary analysis:', error);
            // Provide fallback summary
            const fallbackSummary = "A comprehensive summary could not be generated at this time. Please review your individual virtue analyses for insights into your personal growth areas.";
            setSummaryAnalysis(fallbackSummary);
            
            // Still try to save the fallback
            await supabase
                .from('user_assessments')
                .update({ summary_analysis: fallbackSummary })
                .eq('id', assessmentId);
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    // Generate meaningful fallback analysis
    const generateFallbackAnalysis = (virtueInfo: VirtueInfo, result: Result) => {
        const virtueScore = 10 - result.defectIntensity;
        const scoreDescription = virtueScore >= 8 ? 'strong' : 
                               virtueScore >= 6 ? 'moderate' : 
                               virtueScore >= 4 ? 'developing' : 'area for growth';
        
        return `Your reflection shows ${virtueInfo.name} is a ${scoreDescription} area. This virtue involves ${virtueInfo.description.toLowerCase()}. Every step toward practicing it brings growth.`;
    };

    // --- Initial Data Load ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: virtuesData, error: virtuesError } = await supabase.from('virtues').select('id, name, description');
                if (virtuesError) throw virtuesError;
                setVirtueDetails(virtuesData || []);

                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                setSession(session);
                const user = session?.user;
                if (!user) return;

                // Fetch user profile to get the name
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profile?.full_name) {
                    setUserName(profile.full_name);
                } else {
                    setUserName('User'); // Fallback
                }

                // Fetch assessment with summary_analysis
                const { data: assessmentRecord, error: assessmentError } = await supabase
                    .from('user_assessments')
                    .select('id, summary_analysis')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();
                
                if (assessmentError && assessmentError.code !== 'PGRST116') throw assessmentError;

                if (assessmentRecord) {
                    setCurrentAssessmentId(assessmentRecord.id);
                    setHasExistingAssessment(true);
                    
                    // Set summary analysis if it exists
                    if (assessmentRecord.summary_analysis) {
                        setSummaryAnalysis(assessmentRecord.summary_analysis);
                    }
                    
                    // Fetch defect ratings
                    const { data: defectsData, error: defectsError } = await supabase
                        .from('user_assessment_defects')
                        .select('defect_name, rating, harm_level')
                        .eq('assessment_id', assessmentRecord.id);

                    if (defectsError) throw defectsError;
                    
                    if (defectsData && defectsData.length > 0) {
                        const initialRatings: Ratings = {};
                        const initialHarmLevels: HarmLevels = {};
                        defectsData.forEach(defectData => {
                            initialRatings[defectData.defect_name] = defectData.rating;
                            initialHarmLevels[defectData.defect_name] = defectData.harm_level;
                        });
                        setRatings(initialRatings);
                        setHarmLevels(initialHarmLevels);
                    }

                    // Fetch existing analyses
                    const { data: existingAnalyses, error: analysesError } = await supabase
                        .from('virtue_analysis')
                        .select('virtue_id, analysis_text')
                        .eq('assessment_id', assessmentRecord.id);
                    
                    if (analysesError) throw analysesError;
                    
                    if (existingAnalyses && existingAnalyses.length > 0) {
                        const analysisMap = new Map<string, string>();
                        existingAnalyses.forEach(analysis => {
                            const virtueInfo = virtuesData?.find(v => v.id === analysis.virtue_id);
                            if (virtueInfo) {
                                analysisMap.set(virtueInfo.name, analysis.analysis_text);
                            }
                        });
                        setAnalyses(analysisMap);
                    }

                    // Fetch results to display
                    const { data: resultsData, error: resultsError } = await supabase
                        .from('user_assessment_results')
                        .select('virtue_name, priority_score, defect_intensity')
                        .eq('assessment_id', assessmentRecord.id)
                        .order('priority_score', { ascending: false });
                    
                    if (resultsError) throw resultsError;
                    
                    if (resultsData && resultsData.length > 0) {
                        const prioritizedVirtues = resultsData.map(result => ({
                            virtue: result.virtue_name,
                            priority: result.priority_score,
                            defectIntensity: result.defect_intensity || 0
                        }));
                        setResults(prioritizedVirtues);
                    }
                }
            } catch (error) {
                console.error(`Error loading data: ${error}`);
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, []);

    // --- Fetch existing analyses on mount ---
    useEffect(() => {
        const fetchExistingAnalyses = async () => {
            if (!currentAssessmentId || virtueDetails.length === 0) return;
            
            try {
                const { data: existingAnalyses, error } = await supabase
                    .from('virtue_analysis')
                    .select('virtue_id, analysis_text')
                    .eq('assessment_id', currentAssessmentId);
                
                if (error) return;
                
                if (existingAnalyses && existingAnalyses.length > 0) {
                    const analysisMap = new Map<string, string>();
                    existingAnalyses.forEach(analysis => {
                        const virtueInfo = virtueDetails.find(v => v.id === analysis.virtue_id);
                        if (virtueInfo) {
                            analysisMap.set(virtueInfo.name, analysis.analysis_text);
                        }
                    });
                    setAnalyses(analysisMap);
                }
            } catch (error) {
                console.error('Failed to fetch existing analyses:', error);
            }
        };

        fetchExistingAnalyses();
    }, [currentAssessmentId, virtueDetails]);

    const handleRatingChange = (defectName: string, value: string) => setRatings(prev => ({ ...prev, [defectName]: parseInt(value) }));
    const handleHarmChange = (defectName: string, value: string) => setHarmLevels(prev => ({ ...prev, [defectName]: value }));
    const handlePrint = () => window.print();

    const formatDefectDetailsForPrompt = (virtueName: string, currentRatings: Ratings, currentHarmLevels: HarmLevels) => {
        return defects
            .filter(d => d.virtues.includes(virtueName))
            .map(d => {
                const rating = currentRatings[d.name] || 1;
                const harm = currentHarmLevels[d.name] || "None";
                return `- ${d.name} (Frequency: ${['Never', 'Rarely', 'Sometimes', 'Often', 'Always'][rating - 1]}, Harm: ${harm})`;
            })
            .join('\n');
    };

    // --- Form Submission Logic ---
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setAnalyses(new Map()); 
        setCorsError(false);
        setSummaryAnalysis(null);
        
        const virtueScores: { [key: string]: { score: number; harm: number; defectCount: number } } = {};
        coreVirtuesList.forEach(v => { virtueScores[v] = { score: 0, harm: 0, defectCount: 0 } });

        defects.forEach(defect => {
            const score = ratings[defect.name] || 1;
            const harmValue = harmLevelsMap[harmLevels[defect.name] || "None"];
            defect.virtues.forEach(virtue => {
                if(coreVirtuesList.includes(virtue)) {
                    virtueScores[virtue].score += score;
                    virtueScores[virtue].harm = Math.max(virtueScores[virtue].harm, harmValue);
                    virtueScores[virtue].defectCount++;
                }
            });
        });

        // Calculate priority scores
        const maxFrequencyScore = 5;
        const maxHarmMultiplier = 5;
        
        const prioritizedVirtues = Object.entries(virtueScores)
            .map(([virtue, data]) => {
                const rawPriority = data.score * (data.harm + 1);
                const maxPossibleForVirtue = (data.defectCount * maxFrequencyScore) * maxHarmMultiplier;
                const defectIntensity = maxPossibleForVirtue > 0 ? 
                    (rawPriority / maxPossibleForVirtue) * 10 : 0;
                    
                return { virtue, priority: rawPriority, defectIntensity };
            })
            .filter(v => v.priority > 0)
            .sort((a, b) => b.priority - a.priority);
        setResults(prioritizedVirtues);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            let assessmentId: number;

            if (currentAssessmentId) {
                assessmentId = currentAssessmentId;
            } else {
                const { data: newAssessment, error: assessmentError } = await supabase
                    .from('user_assessments')
                    .insert({ user_id: user.id })
                    .select('id')
                    .single();
                if (assessmentError) throw assessmentError;
                assessmentId = newAssessment.id;
                setCurrentAssessmentId(assessmentId);
                setHasExistingAssessment(true);
            }

            // Clear old data
            const tablesToClear = ['user_assessment_defects', 'user_assessment_results', 'virtue_analysis'];
            for (const table of tablesToClear) {
                await supabase.from(table).delete().eq('assessment_id', assessmentId);
            }
            
            // Insert updated defect ratings
            const defectRatingsToInsert = Object.entries(ratings).map(([defect_name, rating]) => ({
                assessment_id: assessmentId, user_id: user.id, defect_name, rating,
                harm_level: harmLevels[defect_name] || 'None',
            }));
            if (defectRatingsToInsert.length > 0) {
                await supabase.from('user_assessment_defects').insert(defectRatingsToInsert);
            }

            // Insert updated results
            const resultsToInsert = prioritizedVirtues.map(result => ({
                assessment_id: assessmentId, 
                user_id: user.id,
                virtue_name: result.virtue, 
                priority_score: result.priority,
                defect_intensity: result.defectIntensity,
            }));
            if (resultsToInsert.length > 0) {
                await supabase.from('user_assessment_results').insert(resultsToInsert);
            }

            // Trigger AI analysis
            await triggerAndSaveAnalyses(assessmentId, user, prioritizedVirtues, ratings, harmLevels);

        } catch (error) {
            console.error(`Error saving results: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleEdit = async () => {
        setResults(null);
        setAnalyses(new Map());
        setCorsError(false);
        setSummaryAnalysis(null);
    };

    if (loading) return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-stone-600">Loading your assessment...</p>
            </div>
        </div>
    );

    return (
        <>
            <AppHeader />
            <div className="min-h-screen bg-stone-50">
                <div className="container mx-auto p-4 md:p-6 max-w-6xl">
                    {corsError && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 mb-4 rounded-lg text-sm" role="alert">
                            <p className="font-bold">Connection Issue</p>
                            <p>We're experiencing a temporary connection issue. Your personalized analysis has been generated.</p>
                        </div>
                    )}
                    
                    <div id="printable-area">
                        {!results ? (
                            <div className="space-y-4">
                                {/* Assessment Questions - Compact */}
                                <Card className="border-stone-200 shadow-sm">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Target className="h-4 w-4 text-amber-600" />
                                                Personal Reflection
                                            </CardTitle>
                                            <span className="text-sm text-stone-500 bg-stone-100 px-2 py-1 rounded">
                                                {currentPage + 1}/{totalPages}
                                            </span>
                                        </div>
                                        <CardDescription className="text-sm mt-1">
                                            Reflect on these areas of personal growth
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                            {currentDefects.map((defect) => (
                                                <DefectRow 
                                                    key={defect.name} 
                                                    defect={defect} 
                                                    rating={ratings[defect.name]}
                                                    harmLevel={harmLevels[defect.name]}
                                                    onRatingChange={handleRatingChange}
                                                    onHarmChange={handleHarmChange}
                                                />
                                            ))}
                                        </div>

                                        {/* Progress Dots Only (No Bar) */}
                                        <div className="border-t border-stone-200 pt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-stone-700">Progress: {answeredCount}/{totalCount}</span>
                                                <span className="text-xs text-stone-500">{progress}%</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                {Array.from({ length: totalPages }, (_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i)}
                                                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                                                            i === currentPage ? 'bg-amber-600 w-3' : 'bg-stone-300 hover:bg-stone-400'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pagination & Submit */}
                                        <div className="flex items-center justify-between mt-3">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                                disabled={currentPage === 0}
                                                className="text-xs h-8"
                                                size="sm"
                                            >
                                                <ArrowLeft className="h-3 w-3 mr-1" />
                                                Previous
                                            </Button>
                                            
                                            <Button 
                                                variant="outline"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
                                                disabled={currentPage === totalPages - 1}
                                                className="text-xs h-8"
                                                size="sm"
                                            >
                                                Next
                                                <ArrowRight className="h-3 w-3 ml-1" />
                                            </Button>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="mt-3 text-center">
                                            <Button 
                                                onClick={handleSubmit} 
                                                disabled={isSubmitting || answeredCount === 0}
                                                className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700"
                                                size="sm"
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                        Creating Plan...
                                                    </div>
                                                ) : answeredCount === 0 ? (
                                                    "Begin Reflection"
                                                ) : hasExistingAssessment ? (
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Update Plan
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 justify-center">
                                                        <Sparkles className="h-3 w-3" />
                                                        View Results
                                              </div>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            ) : (
                            /* Results Page - Redesigned Layout */
                            <div className="space-y-6">
                                {/* Print header - only shows when printing */}
                                <div className="hidden print:block print-header">
                                    <h1 className="text-2xl font-bold mb-2">New Man New Behaviors Virtue Assessment</h1>
                                    <p className="text-sm text-gray-600 subtitle">Personal Growth and Development Report</p>
                                    <p className="text-xs text-gray-500 date">Generated on {new Date().toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-400 mt-2">Confidential - For Personal Development Use Only</p>
                                </div>

                                {/* Top Row with AI Summary and Rose Chart */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 summary-chart-row">
                                    {/* AI Summary - 1/3 width */}
                                    <Card className="lg:col-span-1 ai-summary-card">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <Sparkles className="h-4 w-4 text-amber-600" />
                                                AI Virtue Summary
                                                {isGeneratingSummary && (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 ml-2"></div>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {summaryAnalysis ? (
                                                <MarkdownRenderer content={summaryAnalysis} />
                                            ) : isGeneratingSummary ? (
                                                <div className="space-y-3 text-sm text-stone-500 italic">
                                                    <p>Generating your comprehensive summary analysis...</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 text-sm text-stone-500 italic">
                                                    <p>Your summary analysis will be generated soon.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                        {/* Rose Chart - 2/3 width */}
                                        <Card className="lg:col-span-2">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">Virtue Rose Chart</CardTitle>
                                            <CardDescription className="text-sm">Visual overview of your growth areas</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex justify-center">
                                            <VirtueRoseChart 
                                            data={results.map((r) => ({ 
                                                virtue: r.virtue, 
                                                score: 10 - r.defectIntensity 
                                            }))} 
                                            size="medium"
                                            data-testid="virtue-chart"
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                                
                                {/* MODIFICATION START: Hidden chart for PDF capture */}
                                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
                                    {results && (
                                        <VirtueRoseChart 
                                            data={results.map((r) => ({ 
                                                virtue: r.virtue, 
                                                score: 10 - r.defectIntensity 
                                            }))} 
                                            size="medium"
                                            forPdf={true} // Prop to trigger PDF-specific rendering
                                        />
                                    )}
                                </div>
                                {/* MODIFICATION END */}


                                {/* Virtue Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 virtue-cards-grid">
                                    {results
                                        .sort((a, b) => (10 - a.defectIntensity) - (10 - b.defectIntensity))
                                        .map(result => {
                                            const virtueScore = 10 - result.defectIntensity;
                                            const analysisText = analyses.get(result.virtue);
                                            const virtueInfo = virtueDetails.find(v => v.name === result.virtue);

                                            return (
                                                <Card key={result.virtue} className="border-stone-200 print:break-inside-avoid">
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-sm font-semibold">{result.virtue}</CardTitle>
                                                            <div className="virtue-score">
                                                                {virtueScore.toFixed(1)}
                                                                <span className="score-label">/10</span>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        {analysisText ? (
                                                            <MarkdownRenderer content={analysisText} />
                                                        ) : (
                                                            <p className="text-stone-500 italic text-xs">Generating guidance...</p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            )
                                        })
                                    }
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <Button onClick={handleEdit} variant="outline" className="flex-1 text-xs h-8">
                                        <ArrowLeft className="h-3 w-3 mr-1" />
                                        Adjust Responses
                                    </Button>
                                    <PrintButton 
                                        results={results}
                                        analyses={analyses}
                                        summaryAnalysis={summaryAnalysis}
                                        userName={userName}
                                    />
                                </div>
                            </div>
)}                    </div>
                </div>
            </div>
        </>
    )
}