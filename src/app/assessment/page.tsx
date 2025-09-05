'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Session } from '@supabase/supabase-js'
import VirtueRoseChart from '@/components/VirtueRoseChart'
import AppHeader from '@/components/AppHeader'
import '../print.css'

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
    { name: "Recklessness", virtues: ["Self-Control", "Mindfulness"] },
    { name: "Resentment", virtues: ["Gratitude", "Compassion"] },
    { name: "Rudeness", virtues: ["Respect", "Compassion"] },
    { name: "Self-centeredness", virtues: ["Humility", "Compassion"] },
    { name: "Self-righteousness", virtues: ["Humility", "Respect"] },
    { name: "Selfishness", virtues: ["Compassion"] },
    { name: "Stealing", virtues: ["Honesty", "Integrity"] },
    { name: "Superiority", virtues: ["Humility", "Respect"] },
    { name: "Unreliability", virtues: ["Responsibility", "Integrity"] }
]

const harmLevelsMap: { [key: string]: number } = { None: 0, Minimal: 1, Moderate: 2, Significant: 3, Severe: 4 }

type Ratings = { [key: string]: number }
type HarmLevels = { [key: string]: string }
type Result = { 
    virtue: string; 
    priority: number; 
    defectIntensity: number;
}

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
)

export default function AssessmentPage() {
    const [loading, setLoading] = useState(true)
    const [ratings, setRatings] = useState<Ratings>({})
    const [harmLevels, setHarmLevels] = useState<HarmLevels>({})
    const [results, setResults] = useState<Result[] | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [session, setSession] = useState<Session | null>(null)

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                if (sessionError) throw sessionError
                setSession(session)
                const user = session?.user
                if (!user) return

                const { data: latestAssessment, error: assessmentError } = await supabase
                    .from('user_assessments').select('id').eq('user_id', user.id)
                    .order('created_at', { ascending: false }).limit(1).maybeSingle()
                if (assessmentError) throw assessmentError

                if (latestAssessment) {
                    const { data: defectDetails, error: detailsError } = await supabase
                        .from('user_assessment_defects').select('defect_name, rating, harm_level')
                        .eq('assessment_id', latestAssessment.id)
                    if (detailsError) throw detailsError

                    const initialRatings: Ratings = {}
                    const initialHarmLevels: HarmLevels = {}
                    if (defectDetails) {
                        defectDetails.forEach(detail => {
                            initialRatings[detail.defect_name] = detail.rating
                            initialHarmLevels[detail.defect_name] = detail.harm_level
                        })
                    }
                    setRatings(initialRatings)
                    setHarmLevels(initialHarmLevels)
                }
            } catch (error) {
                if (error instanceof Error) alert(`Error loading data: ${error.message}`)
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    const handleRatingChange = (defectName: string, value: string) => {
        setRatings(prev => ({ ...prev, [defectName]: parseInt(value) }))
    }

    const handleHarmChange = (defectName: string, value: string) => {
        setHarmLevels(prev => ({ ...prev, [defectName]: value }))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        
        const virtueScores: { [key: string]: { score: number; harm: number; defectCount: number } } = {}
        
        coreVirtuesList.forEach(v => { virtueScores[v] = { score: 0, harm: 0, defectCount: 0 } })

        defects.forEach(defect => {
            const score = ratings[defect.name] || 1
            const harmValue = harmLevelsMap[harmLevels[defect.name] || "None"]
            defect.virtues.forEach(virtue => {
                if(coreVirtuesList.includes(virtue)) {
                    virtueScores[virtue].score += score
                    virtueScores[virtue].harm = Math.max(virtueScores[virtue].harm, harmValue)
                    virtueScores[virtue].defectCount++
                }
            })
        })

        const prioritizedVirtues = Object.entries(virtueScores)
            .map(([virtue, data]) => {
                const rawPriority = data.score * (data.harm + 1)
                const maxPossibleScore = data.defectCount * 25 // 5 (max rating) * 5 (max harm + 1)
                const defectIntensity = maxPossibleScore > 0 ? (rawPriority / maxPossibleScore) * 10 : 0
                return { 
                    virtue, 
                    priority: rawPriority,
                    defectIntensity: defectIntensity,
                }
            })
            .filter(v => v.priority > 0)
            .sort((a, b) => b.priority - a.priority)
        setResults(prioritizedVirtues)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("User not found")

            const { data: assessment, error: assessmentError } = await supabase
                .from('user_assessments').insert({ user_id: user.id, assessment_type: 'initial' }).select().single()
            if (assessmentError) throw assessmentError

            const defectRatingsToInsert = Object.entries(ratings).map(([defect_name, rating]) => ({
                assessment_id: assessment.id, user_id: user.id, defect_name, rating,
                harm_level: harmLevels[defect_name] || 'None',
            }))
            if (defectRatingsToInsert.length > 0) {
                const { error: defectsError } = await supabase.from('user_assessment_defects').insert(defectRatingsToInsert)
                if (defectsError) throw defectsError
            }

            const resultsToInsert = prioritizedVirtues.map(result => ({
                assessment_id: assessment.id, user_id: user.id,
                virtue_name: result.virtue, priority_score: result.priority,
            }))
            if (resultsToInsert.length > 0) {
                const { error: resultsError } = await supabase.from('user_assessment_results').insert(resultsToInsert)
                if (resultsError) throw resultsError
            }
        } catch (error) {
            if (error instanceof Error) {
                alert(`Error saving results: ${error.message}`)
            } else {
                alert('An unknown error occurred while saving results.')
            }
        } finally {
            setIsSubmitting(false)
        }
    }
    
    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return <div className="p-8 text-center">Loading assessment...</div>
    }

    return (
        <>
            <AppHeader />
            <div className="container mx-auto p-4 md:p-8">
                <div id="printable-area">
                    {!results ? (
                        <Card className="no-print">
                            <CardHeader>
                                <CardTitle className="text-2xl">Character Defects Inventory</CardTitle>
                                <CardDescription>Rate each defect based on its frequency and the level of harm it causes. Your virtues to develop will be revealed upon submission.</CardDescription>
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
                                        {isSubmitting ? 'Saving...' : 'Reveal Virtues to Develop'}
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

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">Your Prioritized Virtues</CardTitle>
                                    <CardDescription>This chart shows your virtue scores based on your self-assessment. A lower score indicates a greater need for development in that area.</CardDescription>
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

                            <div className="mt-6 flex gap-2 no-print">
                                <Button onClick={() => setResults(null)}>Edit Answers</Button>
                                <Button variant="outline" onClick={handlePrint}>Print / Download PDF</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}