'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Session } from '@supabase/supabase-js'
import AppHeader from '@/components/AppHeader'
import { Sparkles } from 'lucide-react'
import VirtueRoseChart from '@/components/VirtueRoseChart'
import '../print.css'

// --- Data & Types ---
const coreVirtuesList = ["Humility", "Honesty", "Gratitude", "Self-Control", "Mindfulness", "Patience", "Integrity", "Compassion", "Healthy Boundaries", "Responsibility", "Vulnerability", "Respect"]
const defects = [
    { name: "Addictive tendencies", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Anger", virtues: ["Patience", "Compassion", "Self-Control"] },
    { name: "Apathy", virtues: ["Compassion", "Responsibility"] },
    { name: "Arrogance", virtues: ["Humility", "Respect"] },
    { name: "Betrayal", virtues: ["Honesty", "Integrity", "Respect"] },
    { name: "Bitterness", virtues: ["Gratitude", "Compassion"] },
    { name: "Blaming others", virtues: ["Responsibility", "Honesty"] },
    { name: "Boastfulness", virtues: ["Humility"] },
    { name: "Close-mindedness", virtues: ["Humility", "Respect"] },
    { name: "Compulsiveness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Conceit", virtues: ["Humility"] },
    { name: "Cruelty", virtues: ["Compassion", "Respect"] },
    { name: "Deceit", virtues: ["Honesty", "Integrity"] },
    { name: "Defensiveness", virtues: ["Humility", "Vulnerability"] },
    { name: "Dishonesty", virtues: ["Honesty", "Integrity"] },
    { name: "Disrespect", virtues: ["Respect", "Compassion"] },
    { name: "Distrust", virtues: ["Vulnerability", "Honesty"] },
    { name: "Egotism", virtues: ["Humility", "Respect"] },
    { name: "Haughtiness", virtues: ["Humility", "Respect"] },
    { name: "Hypocrisy", virtues: ["Honesty", "Integrity"] },
    { name: "Impatience", virtues: ["Patience", "Mindfulness"] },
    { name: "Impulsiveness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Indifference", virtues: ["Compassion", "Responsibility"] },
    { name: "Ingratitude", virtues: ["Gratitude"] },
    { name: "Infidelity", virtues: ["Honesty", "Integrity", "Respect"] },
    { name: "Intolerance", virtues: ["Respect", "Compassion"] },
    { name: "Irresponsibility", virtues: ["Responsibility"] },
    { name: "Judgmental attitude", virtues: ["Compassion", "Respect"] },
    { name: "Lack of empathy", virtues: ["Compassion"] },
    { name: "Lack of gratitude", virtues: ["Gratitude"] },
    { name: "Lack of self-control", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Lying", virtues: ["Honesty", "Integrity"] },
    { name: "Manipulation", virtues: ["Honesty", "Respect", "Integrity"] },
    { name: "Narcissism", virtues: ["Humility", "Compassion"] },
    { name: "Neglect", virtues: ["Responsibility", "Compassion"] },
    { name: "Objectification", virtues: ["Respect", "Compassion"] },
    { name: "Pride", virtues: ["Humility", "Respect"] },
    { name: "Recklessness", virtues: ["Self-Control", "Mindfulness"] }, // FIXED: Added missing quote
    { name: "Resentment", virtues: ["Gratitude", "Compassion"] },
    { name: "Rudeness", virtues: ["Respect", "Compassion"] },
    { name: "Self-centeredness", virtues: ["Humility", "Compassion"] },
    { name: "Self-righteousness", virtues: ["Humility", "Respect"] },
    { name: "Selfishness", virtues: ["Compassion"] },
    { name: "Stealing", virtues: ["Honesty", "Integrity"] },
    { name: "Superiority", virtues: ["Humility", "Respect"] },
    { name: "Unreliability", virtues: ["Responsibility", "Integrity"] }
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
    defect: { name: string };
    rating?: number;
    harmLevel?: string;
    onRatingChange: (name: string, value: string) => void;
    onHarmChange: (name: string, value: string) => void;
}) => (
    <div className="flex flex-col md:flex-row md:items-center border-b p-2 space-y-2 md:space-y-0">
        <div className="w-full md:w-1/4 font-medium">{defect.name}</div>
        <div className="w-full md:w-2/4">
            <RadioGroup onValueChange={(value) => onRatingChange(defect.name, value)} value={String(rating || '')} className="flex items-center justify-around">
                {[1, 2, 3, 4, 5].map(value => (
                    <div key={value} className="flex flex-col items-center space-y-1">
                        <Label htmlFor={`${defect.name}-${value}`} className="text-xs text-gray-500">{['Never', 'Rarely', 'Sometimes', 'Often', 'Always'][value - 1]}</Label>
                        <RadioGroupItem value={String(value)} id={`${defect.name}-${value}`} />
                    </div>
                ))}
            </RadioGroup>
        </div>
        <div className="w-full md:w-1/4">
            <Select onValueChange={(value) => onHarmChange(defect.name, value)} value={harmLevel || ''}>
                <SelectTrigger><SelectValue placeholder="Harm Level..." /></SelectTrigger>
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
);

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
                    console.log(`Calling Astrid for ${result.virtue}, attempt ${4 - retries}`);
                    
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
                        // Check if this is a CORS error
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

                    console.log(`Received analysis for ${result.virtue}, saving to DB...`);

                    // Save to database
                    const { error: insertError } = await supabase.from('virtue_analysis').insert({
                        user_id: user.id,
                        assessment_id: assessmentId,
                        virtue_id: virtueInfo.id,
                        analysis_text: data.analysis
                    });

                    if (insertError) {
                        console.error(`Database insert error for ${result.virtue}:`, insertError);
                        throw new Error(`Database error: ${insertError.message}`);
                    }

                    console.log(`Successfully saved analysis for ${result.virtue} to DB`);
                    
                    // Immediately update the local state to reflect the new analysis
                    setAnalyses(prev => {
                        const newMap = new Map(prev);
                        newMap.set(result.virtue, data.analysis);
                        console.log(`Updated local state for ${result.virtue}`);
                        return newMap;
                    });

                    success = true;
                    console.log(`Successfully processed ${result.virtue}`);

                } catch (error) {
                    console.error(`Attempt failed for ${result.virtue}:`, error);
                    
                    // If it's a CORS error, don't retry - use fallback immediately
                    if (corsErrorOccurred) {
                        console.log('CORS error detected, using fallback analysis');
                        break;
                    }
                    
                    retries--;
                    
                    if (retries === 0 || corsErrorOccurred) {
                        console.error(`All retries failed for ${result.virtue}`);
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
                            console.log(`Set fallback analysis for ${result.virtue}`);
                            return newMap;
                        });
                    } else {
                        // Wait before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
        }
    };

    // Generate meaningful fallback analysis
    const generateFallbackAnalysis = (virtueInfo: VirtueInfo, result: Result) => {
        const virtueScore = 10 - result.defectIntensity;
        const scoreDescription = virtueScore >= 8 ? 'strong' : 
                               virtueScore >= 6 ? 'moderate' : 
                               virtueScore >= 4 ? 'developing' : 'area for growth';
        
        return `I see you're working on ${virtueInfo.name}. Your self-reflection shows real commitment to personal growth. 

This virtue involves ${virtueInfo.description.toLowerCase()}. Based on your assessment, this appears to be a ${scoreDescription} area for you. 

Remember that awareness is the first step toward meaningful change. Your willingness to engage in this honest self-assessment demonstrates the courage needed to develop ${virtueInfo.name.toLowerCase()} in your daily life.

Every small step you take toward practicing this virtue brings you closer to the person you aspire to be.`;
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

                const { data: assessmentRecord, error: assessmentError } = await supabase
                    .from('user_assessments').select('id').eq('user_id', user.id)
                    .single();
                
                if (assessmentError && assessmentError.code !== 'PGRST116') throw assessmentError;

                if (assessmentRecord) {
                    setCurrentAssessmentId(assessmentRecord.id);
                    setHasExistingAssessment(true);
                    
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
                }
            } catch (error) {
                if (error instanceof Error) console.error(`Error loading data: ${error.message}`)
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, []);

    // --- Fetch existing analyses on mount ---
    useEffect(() => {
        const fetchExistingAnalyses = async () => {
            if (!currentAssessmentId) return;
            
            try {
                const { data: existingAnalyses, error } = await supabase
                    .from('virtue_analysis')
                    .select('virtue_id, analysis_text')
                    .eq('assessment_id', currentAssessmentId);
                
                if (error) {
                    console.error('Error fetching existing analyses:', error);
                    return;
                }
                
                if (existingAnalyses && existingAnalyses.length > 0) {
                    const analysisMap = new Map<string, string>();
                    existingAnalyses.forEach(analysis => {
                        const virtueInfo = virtueDetails.find(v => v.id === analysis.virtue_id);
                        if (virtueInfo) {
                            analysisMap.set(virtueInfo.name, analysis.analysis_text);
                        }
                    });
                    setAnalyses(analysisMap);
                    console.log('Loaded existing analyses:', analysisMap.size);
                }
            } catch (error) {
                console.error('Failed to fetch existing analyses:', error);
            }
        };

        fetchExistingAnalyses();
    }, [currentAssessmentId, virtueDetails]);

    // --- Real-time Listener for AI Analysis ---
    useEffect(() => {
        if (!currentAssessmentId) return;

        console.log('Setting up real-time listener for assessment:', currentAssessmentId);

        const channel = supabase.channel(`analysis-listener-${currentAssessmentId}`)
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'virtue_analysis', 
                    filter: `assessment_id=eq.${currentAssessmentId}`
                },
                (payload) => {
                    console.log('Real-time update received:', payload);
                    const newAnalysis = payload.new as VirtueAnalysis;
                    const virtueInfo = virtueDetails.find(v => v.id === newAnalysis.virtue_id);
                    if (virtueInfo) {
                        console.log(`Updating analysis for virtue: ${virtueInfo.name}`);
                        setAnalyses(prev => {
                            const newMap = new Map(prev);
                            newMap.set(virtueInfo.name, newAnalysis.analysis_text);
                            return newMap;
                        });
                    } else {
                        console.warn('Virtue not found for analysis:', newAnalysis.virtue_id);
                    }
                }
            )
            .subscribe((status) => {
                console.log('Real-time subscription status:', status);
            });

        return () => { 
            console.log('Cleaning up real-time listener');
            supabase.removeChannel(channel); 
        };
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

        const prioritizedVirtues = Object.entries(virtueScores)
            .map(([virtue, data]) => {
                const rawPriority = data.score * (data.harm + 1);
                const maxPossibleScore = data.defectCount * 25;
                const defectIntensity = maxPossibleScore > 0 ? (rawPriority / maxPossibleScore) * 10 : 0;
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

            // Clear old data associated with this assessment before inserting new data
            const tablesToClear = ['user_assessment_defects', 'user_assessment_results', 'virtue_analysis'];
            for (const table of tablesToClear) {
                const { error: deleteError } = await supabase.from(table).delete().eq('assessment_id', assessmentId);
                if (deleteError) {
                    console.error(`Failed to clear ${table}:`, deleteError);
                    throw deleteError;
                }
            }
            
            // Insert updated defect ratings and harm levels
            const defectRatingsToInsert = Object.entries(ratings).map(([defect_name, rating]) => ({
                assessment_id: assessmentId, user_id: user.id, defect_name, rating,
                harm_level: harmLevels[defect_name] || 'None',
            }));
            if (defectRatingsToInsert.length > 0) {
                const { error: defectsError } = await supabase.from('user_assessment_defects').insert(defectRatingsToInsert);
                if (defectsError) throw defectsError;
            }

            // Insert updated results
            const resultsToInsert = prioritizedVirtues.map(result => ({
                assessment_id: assessmentId, user_id: user.id,
                virtue_name: result.virtue, priority_score: result.priority,
            }));
            if (resultsToInsert.length > 0) {
                const { error: resultsError } = await supabase.from('user_assessment_results').insert(resultsToInsert);
                if (resultsError) throw resultsError;
            }

            // Trigger the new AI analysis
            await triggerAndSaveAnalyses(assessmentId, user, prioritizedVirtues, ratings, harmLevels);

        } catch (error) {
            if (error instanceof Error) console.error(`Error saving results: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleEdit = async () => {
        setResults(null);
        setAnalyses(new Map());
        setCorsError(false);
    };

    if (loading) return <div className="p-8 text-center">Loading assessment...</div>

    return (
        <>
            <AppHeader />
            <div className="container mx-auto p-4 md:p-8">
                {corsError && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                        <p className="font-bold">Connection Issue</p>
                        <p>We're experiencing a temporary connection issue with our AI analysis service. Fallback analyses have been generated.</p>
                    </div>
                )}
                
                <div id="printable-area">
                    {!results ? (
                        <Card className="no-print">
                            <CardHeader>
                                <CardTitle className="text-2xl">Character Defects Inventory</CardTitle>
                                <CardDescription>
                                    {hasExistingAssessment 
                                        ? "Update your assessment below. Your previous answers are pre-filled."
                                        : "Rate each defect based on its frequency and the level of harm it causes."
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col">
                                    {defects.map((defect) => (
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
                                <div className="mt-6 flex">
                                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                                        {isSubmitting ? 'Saving...' : hasExistingAssessment ? 'Update & Re-analyze' : 'Reveal Virtues to Develop'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                         <div>
                             <div className="print-header" style={{ display: 'none' }}>
                                 <h1 className="text-xl font-bold">New Man App</h1>
                                 <h2 className="text-lg">Character Defects Inventory Results</h2>
                                 <p className="text-sm text-gray-600">User: {session?.user?.email}</p>
                                 <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                             </div>

                             <Card className="mb-6">
                                 <CardHeader>
                                     <CardTitle className="text-xl font-bold">Your Virtue Overview</CardTitle>
                                     <CardDescription>This chart provides a holistic view of your self-assessment results.</CardDescription>
                                 </CardHeader>
                                 <CardContent>
                                     <VirtueRoseChart 
                                         data={results.map((r) => ({ 
                                             virtue: r.virtue, 
                                             score: 10 - r.defectIntensity 
                                         }))} 
                                         size="large"
                                     />
                                 </CardContent>
                             </Card>

                             <div className="mb-6">
                                 <h2 className="text-3xl font-light text-stone-800">Your Prioritized Virtues</h2>
                                 <p className="text-stone-600 mt-1">Here is a breakdown of your virtues, along with personalized analysis from your virtual sponsor, Astrid.</p>
                             </div>

                             <div className="space-y-4">
                                 {results.map(result => {
                                     const virtueScore = 10 - result.defectIntensity;
                                     const analysisText = analyses.get(result.virtue);
                                     
                                     const virtueInfo = virtueDetails.find(v => v.name === result.virtue);

                                     return (
                                         <Card key={result.virtue}>
                                             <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                                                 <div className="relative w-16 h-16 flex-shrink-0">
                                                     <svg className="w-full h-full" viewBox="0 0 36 36">
                                                         <path className="text-stone-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                                         <path className="text-amber-600" strokeDasharray={`${virtueScore * 10}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                                     </svg>
                                                     <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-stone-700">{virtueScore.toFixed(1)}</span>
                                                 </div>
                                                 <div className="flex-grow">
                                                     <CardTitle>{result.virtue}</CardTitle>
                                                     <CardDescription>Your score reflects this as a key area for growth.</CardDescription>
                                                 </div>
                                             </CardHeader>
                                             <CardContent>
                                                 <div className="flex items-start gap-4 mt-2 p-4 border bg-stone-50 rounded-lg">
                                                     <Sparkles className="h-6 w-6 text-amber-700 flex-shrink-0 mt-1" />
                                                     <div>
                                                         <h4 className="font-semibold text-stone-800">Astrid's Analysis</h4>
                                                         {analysisText ? (
                                                             <p className="text-stone-700 mt-1">{analysisText}</p>
                                                         ) : (
                                                             <p className="text-stone-500 italic mt-1">
                                                                 Generating analysis... 
                                                                 <span className="text-xs block mt-1">(Virtue ID: {virtueInfo?.id})</span>
                                                             </p>
                                                         )}
                                                     </div>
                                                 </div>
                                             </CardContent>
                                         </Card>
                                     )
                                 })}
                             </div>

                             <div className="mt-6 flex gap-2 no-print">
                                 <Button onClick={handleEdit}>Edit Answers</Button>
                                 <Button variant="outline" onClick={handlePrint}>Print / Download PDF</Button>
                             </div>
                         </div>
                    )}
                </div>
            </div>
        </>
    )
}