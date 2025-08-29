'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Session } from '@supabase/supabase-js'
import '../print.css'; // Correctly import the global print stylesheet

// --- Data aligned with the 12 Core Virtues ---
const coreVirtuesList = ["Humility", "Honesty", "Gratitude", "Self-Control", "Mindfulness", "Patience", "Integrity", "Compassion", "Healthy Boundaries", "Responsibility", "Vulnerability", "Respect"];

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
    { name: "Recklessness", virtues: ["Self-Control", "Mindfulness"] },
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
const harmNumberToLabel: { [key: number]: string } = { 0: "None", 1: "Minimal", 2: "Moderate", 3: "Significant", 4: "Severe" };

type Ratings = { [key: string]: number };
type HarmLevels = { [key: string]: string };
type Result = { 
    virtue: string; 
    priority: number; 
    averageRating: number;
    maxHarm: number;
    defectIntensity: number;
    defects: { name: string; score: number; harm: string }[] 
};

const DefectRow = ({ defect, rating, harmLevel, onRatingChange, onHarmChange }: { 
    defect: { name: string }, 
    rating?: number, 
    harmLevel?: string, 
    onRatingChange: (name: string, value: string) => void, 
    onHarmChange: (name: string, value: string) => void 
}) => (
    <div className="flex flex-col md:flex-row md:items-center border-b p-2 space-y-2 md:space-y-0">
        <div className="w-full md:w-1/4 font-medium">{defect.name}</div>
        <div className="w-full md:w-2/4">
            <RadioGroup onValueChange={(value) => onRatingChange(defect.name, value)} value={String(rating || '')} className="flex items-center justify-around">
                {[1,2,3,4,5].map(value => (
                    <div key={value} className="flex flex-col items-center space-y-1">
                        <Label htmlFor={`${defect.name}-${value}`} className="text-xs text-gray-500">{['Never','Rarely','Sometimes','Often','Always'][value-1]}</Label>
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

// Helper function to get the correct color for the bar
const getBarColorClass = (rating: number): string => {
    const percentage = (rating / 5) * 100;
    if (percentage > 75) return 'bg-red-600 print-bar-red';
    if (percentage > 50) return 'bg-orange-500 print-bar-orange';
    if (percentage > 25) return 'bg-yellow-400 print-bar-yellow';
    return 'bg-green-500 print-bar-green';
};

export default function AssessmentPage() {
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState<Ratings>({});
    const [harmLevels, setHarmLevels] = useState<HarmLevels>({});
    const [results, setResults] = useState<Result[] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;
                setSession(session);
                const user = session?.user;
                if (!user) throw new Error("User not found");

                const { data: latestAssessment, error: assessmentError } = await supabase
                    .from('user_assessments').select('id').eq('user_id', user.id)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle();
                if (assessmentError) throw assessmentError;

                if (latestAssessment) {
                    const { data: defectDetails, error: detailsError } = await supabase
                        .from('user_assessment_defects').select('defect_name, rating, harm_level')
                        .eq('assessment_id', latestAssessment.id);
                    if (detailsError) throw detailsError;

                    const initialRatings: Ratings = {};
                    const initialHarmLevels: HarmLevels = {};
                    if (defectDetails) {
                        defectDetails.forEach(detail => {
                            initialRatings[detail.defect_name] = detail.rating;
                            initialHarmLevels[detail.defect_name] = detail.harm_level;
                        });
                    }
                    setRatings(initialRatings);
                    setHarmLevels(initialHarmLevels);
                }
            } catch (error) {
                if (error instanceof Error) alert(`Error loading data: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleRatingChange = (defectName: string, value: string) => {
        setRatings(prev => ({ ...prev, [defectName]: parseInt(value) }));
    };

    const handleHarmChange = (defectName: string, value: string) => {
        setHarmLevels(prev => ({ ...prev, [defectName]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const virtueScores: { [key: string]: { score: number; harm: number; defects: any[], defectCount: number } } = {};
        coreVirtuesList.forEach(v => { virtueScores[v] = { score: 0, harm: 0, defects: [], defectCount: 0 }; });
        defects.forEach(defect => {
            const score = ratings[defect.name] || 1;
            const harmValue = harmLevelsMap[harmLevels[defect.name] || "None"];
            defect.virtues.forEach(virtue => {
                if(coreVirtuesList.includes(virtue)) {
                    virtueScores[virtue].score += score;
                    virtueScores[virtue].harm = Math.max(virtueScores[virtue].harm, harmValue);
                    virtueScores[virtue].defectCount++;
                    if (score > 1) {
                        virtueScores[virtue].defects.push({ name: defect.name, score, harm: harmLevels[defect.name] || "None" });
                    }
                }
            });
        });
        const prioritizedVirtues = Object.entries(virtueScores)
            .map(([virtue, data]) => {
                const rawPriority = data.score * (data.harm + 1);
                const maxPossibleScore = data.defectCount * 25;
                const defectIntensity = maxPossibleScore > 0 ? (rawPriority / maxPossibleScore) * 10 : 0;
                return { 
                    virtue, 
                    priority: rawPriority,
                    averageRating: data.defects.length > 0 ? data.defects.reduce((sum, d) => sum + d.score, 0) / data.defects.length : 0,
                    maxHarm: data.harm,
                    defectIntensity: defectIntensity,
                    defects: data.defects 
                };
            })
            .filter(v => v.priority > 0)
            .sort((a, b) => b.priority - a.priority);
        setResults(prioritizedVirtues);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");
            const { data: assessment, error: assessmentError } = await supabase
                .from('user_assessments').insert({ user_id: user.id, assessment_type: 'initial' }).select().single();
            if (assessmentError) throw assessmentError;
            const defectRatingsToInsert = Object.entries(ratings).map(([defect_name, rating]) => ({
                assessment_id: assessment.id, user_id: user.id, defect_name, rating,
                harm_level: harmLevels[defect_name] || 'None',
            }));
             if (defectRatingsToInsert.length > 0) {
                const { error: defectsError } = await supabase.from('user_assessment_defects').insert(defectRatingsToInsert);
                if (defectsError) throw defectsError;
            }
            const resultsToInsert = prioritizedVirtues.map(result => ({
                assessment_id: assessment.id, user_id: user.id,
                virtue_name: result.virtue, priority_score: result.priority,
            }));
            if (resultsToInsert.length > 0) {
                const { error: resultsError } = await supabase.from('user_assessment_results').insert(resultsToInsert);
                if (resultsError) throw resultsError;
            }
        } catch (error) {
            // This is the Vercel build fix
            if (error instanceof Error) {
                alert(`Error saving results: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="p-8 text-center">Loading assessment...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card className="no-print">
                <CardHeader>
                    <CardTitle className="text-2xl">Character Defects Inventory</CardTitle>
                    <CardDescription>Rate each defect and its harm level. Virtues to develop will be revealed upon submission.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!results ? (
                        <>
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
                            <div className="mt-6 flex flex-col md:flex-row gap-2">
                                <Link href="/" className="flex-1">
                                    <Button variant="outline" className="w-full">Back to Dashboard</Button>
                                </Link>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                                    {isSubmitting ? 'Saving...' : 'Reveal Virtues to Develop'}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="mt-6">
                            <div className="flex gap-2 no-print">
                                <Link href="/" className="inline-block">
                                    <Button>Back to Dashboard</Button>
                                </Link>
                                <Button variant="outline" onClick={handlePrint}>Print / Download PDF</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {results && (
                <div id="printable-area" className="mt-6">
                    <div className="print-header" style={{ display: 'none' }}>
                        <h1 className="text-xl font-bold">New Man App</h1>
                        <h2 className="text-lg">Character Defects Inventory Results</h2>
                        <p className="text-sm text-gray-600">User: {session?.user?.email}</p>
                        <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Your Prioritized Virtues</h2>
                    <p className="mb-4 text-sm">This assessment highlights the virtues that address your most frequent and harmful character defects.</p>
                    <div className="space-y-4">
                        {results.map(({ virtue, defectIntensity, averageRating, maxHarm }) => (
                            <div key={virtue} className="p-3 border rounded-lg print-card">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-base font-bold">{virtue}</h3>
                                    <span className="text-xs font-semibold">Defect Intensity: {defectIntensity.toFixed(1)} / 10</span>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-medium">Average Rating (Frequency)</Label>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                            {/* This is the restored graph bar logic */}
                                            <div 
                                                className={`h-2.5 rounded-full ${getBarColorClass(averageRating)}`}
                                                style={{ width: `${(averageRating / 5) * 100}%` }}>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-medium">Maximum Harm Level</Label>
                                        <p className="text-sm font-semibold">{harmNumberToLabel[maxHarm]}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

