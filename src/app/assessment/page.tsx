// src/app/assessment/page.tsx -- UPDATED VERSION

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Data from your prototype
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
    { name: "Cowardice", virtues: ["Vulnerability", "Courage"] },
    { name: "Cruelty", virtues: ["Compassion", "Respect"] },
    { name: "Deceit", virtues: ["Honesty", "Integrity"] },
    { name: "Defensiveness", virtues: ["Humility", "Vulnerability"] },
    { name: "Dishonesty", virtues: ["Honesty", "Integrity"] },
    { name: "Disrespect", virtues: ["Respect", "Compassion"] },
    { name: "Distrust", virtues: ["Vulnerability", "Honesty"] },
    { name: "Egotism", virtues: ["Humility", "Respect"] },
    { name: "Envy", virtues: ["Gratitude", "Contentment"] },
    { name: "Fearfulness", virtues: ["Vulnerability", "Courage"] },
    { name: "Greed", virtues: ["Gratitude", "Generosity"] },
    { name: "Haughtiness", virtues: ["Humility", "Respect"] },
    { name: "Hypocrisy", virtues: ["Honesty", "Integrity"] },
    { name: "Impatience", virtues: ["Patience", "Mindfulness"] },
    { name: "Impulsiveness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Indifference", virtues: ["Compassion", "Responsibility"] },
    { name: "Ingratitude", virtues: ["Gratitude"] },
    { name: "Infidelity", virtues: ["Honesty", "Integrity", "Respect"] },
    { name: "Intolerance", virtues: ["Respect", "Compassion"] },
    { name: "Irresponsibility", virtues: ["Responsibility"] },
    { name: "Jealousy", virtues: ["Gratitude", "Contentment"] },
    { name: "Judgmental attitude", virtues: ["Compassion", "Respect"] },
    { name: "Lack of empathy", virtues: ["Compassion"] },
    { name: "Lack of gratitude", virtues: ["Gratitude"] },
    { name: "Lack of self-control", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Laziness", virtues: ["Responsibility", "Effort"] },
    { name: "Lying", virtues: ["Honesty", "Integrity"] },
    { name: "Manipulation", virtues: ["Honesty", "Respect", "Integrity"] },
    { name: "Narcissism", virtues: ["Humility", "Compassion"] },
    { name: "Neglect", virtues: ["Responsibility", "Compassion"] },
    { name: "Objectification", virtues: ["Respect", "Compassion"] },
    { name: "Pride", virtues: ["Humility", "Respect"] },
    { name: "Procrastination", virtues: ["Responsibility", "Effort"] },
    { name: "Recklessness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Resentment", virtues: ["Gratitude", "Compassion"] },
    { name: "Rudeness", virtues: ["Respect", "Compassion"] },
    { name: "Self-centeredness", virtues: ["Humility", "Compassion"] },
    { name: "Self-righteousness", virtues: ["Humility", "Respect"] },
    { name: "Selfishness", virtues: ["Compassion", "Generosity"] },
    { name: "Stealing", virtues: ["Honesty", "Integrity"] },
    { name: "Stubbornness", virtues: ["Humility", "Openness"] },
    { name: "Superiority", virtues: ["Humility", "Respect"] },
    { name: "Suspicion", virtues: ["Vulnerability", "Trust"] },
    { name: "Unreliability", virtues: ["Responsibility", "Integrity"] },
    { name: "Vindictiveness", virtues: ["Compassion", "Forgiveness"] },
    { name: "Withdrawn behavior", virtues: ["Vulnerability", "Connection"] }
];
const virtuesList = ["Humility", "Honesty", "Gratitude", "Self-Control", "Mindfulness", "Patience", "Integrity", "Compassion", "Healthy Boundaries", "Responsibility", "Vulnerability", "Respect", "Courage", "Contentment", "Generosity", "Effort", "Openness", "Trust", "Forgiveness", "Connection"];
const harmLevelsMap: { [key: string]: number } = { None: 0, Minimal: 1, Moderate: 2, Significant: 3, Severe: 4 };

type Ratings = { [key: string]: number };
type HarmLevels = { [key: string]: string };
type Result = { virtue: string; priority: number; defects: { name: string; score: number; harm: string }[] };

export default function AssessmentPage() {
    const [ratings, setRatings] = useState<Ratings>({});
    const [harmLevels, setHarmLevels] = useState<HarmLevels>({});
    const [results, setResults] = useState<Result[] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRatingChange = (defectName: string, value: string) => {
        setRatings(prev => ({ ...prev, [defectName]: parseInt(value) }));
    };

    const handleHarmChange = (defectName: string, value: string) => {
        setHarmLevels(prev => ({ ...prev, [defectName]: value }));
    };

    const DefectRow = ({ defect }: { defect: { name: string } }) => (
        <div className="flex flex-col md:flex-row md:items-center border-b p-2 space-y-2 md:space-y-0">
            <div className="w-full md:w-1/4 font-medium">{defect.name}</div>
            <div className="w-full md:w-2/4">
                <RadioGroup onValueChange={(value) => handleRatingChange(defect.name, value)} className="flex items-center justify-around">
                    {[1,2,3,4,5].map(value => (
                        <div key={value} className="flex flex-col items-center space-y-1">
                            <Label htmlFor={`${defect.name}-${value}`} className="text-xs text-gray-500">{['Never','Rarely','Sometimes','Often','Always'][value-1]}</Label>
                            <RadioGroupItem value={String(value)} id={`${defect.name}-${value}`} />
                        </div>
                    ))}
                </RadioGroup>
            </div>
            <div className="w-full md:w-1/4">
                <Select onValueChange={(value) => handleHarmChange(defect.name, value)}>
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

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const virtueScores: { [key: string]: { score: number; harm: number; defects: any[] } } = {};
        virtuesList.forEach(v => { virtueScores[v] = { score: 0, harm: 0, defects: [] }; });
        defects.forEach(defect => {
            const score = ratings[defect.name] || 1;
            const harmValue = harmLevelsMap[harmLevels[defect.name] || "None"];
            defect.virtues.forEach(virtue => {
                virtueScores[virtue].score += score;
                virtueScores[virtue].harm = Math.max(virtueScores[virtue].harm, harmValue);
                if (score > 1) {
                    virtueScores[virtue].defects.push({ name: defect.name, score, harm: harmLevels[defect.name] || "None" });
                }
            });
        });
        const prioritizedVirtues = Object.entries(virtueScores)
            .map(([virtue, data]) => ({ virtue, priority: data.score * (data.harm + 1), defects: data.defects }))
            .filter(v => v.priority > 0)
            .sort((a, b) => b.priority - a.priority);
        setResults(prioritizedVirtues);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");
            const { data: assessment, error: assessmentError } = await supabase
                .from('user_assessments').insert({ user_id: user.id }).select().single();
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
            if (error instanceof Error) alert(`Error saving results: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Character Defects Inventory</CardTitle>
                    <CardDescription>Rate each defect and its harm level. Virtues to develop will be revealed upon submission.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!results ? (
                        <>
                            <div className="flex flex-col">
                                {defects.map((defect) => (
                                    <DefectRow key={defect.name} defect={defect} />
                                ))}
                            </div>
                            {/* NEW BUTTON GROUP */}
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
                            <h2 className="text-xl font-bold mb-2">Prioritized Virtues to Develop</h2>
                            <p className="mb-4">Begin your virtue practice with the top-ranked virtue below, as it addresses the most pressing defects.</p>
                            <ul className="space-y-4">
                                {results.map(({ virtue, priority }) => (
                                    <li key={virtue}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold">{virtue}</span>
                                            <span className="text-sm font-medium">Priority: {priority}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-4">
                                            <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${Math.min(100, Math.round((priority / (results[0].priority || 1)) * 100))}%` }}></div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/" className="mt-6 inline-block">
                                <Button>Back to Dashboard</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}