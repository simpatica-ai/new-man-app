'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Brain, Database, Zap, TestTube } from 'lucide-react'

type FineTuningJob = {
  name: string
  displayName: string
  state: string
  createTime: string
  endTime?: string
  tunedModelEndpoint?: string
}

export default function VirtueAIPanel() {
  const [generating, setGenerating] = useState(false)
  const [fineTuning, setFineTuning] = useState(false)
  const [jobs, setJobs] = useState<FineTuningJob[]>([])
  const [testPrompt, setTestPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [generationParams, setGenerationParams] = useState({
    temperature: 0.2,
    numExamples: 50,
    customPrompt: '',
    promptName: '',
    philosophicalTradition: 'General'
  })
  const [trainingData, setTrainingData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTradition, setSelectedTradition] = useState('All')
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({ input_text: '', output_text: '', notes: '' })
  
  const filteredData = trainingData.filter(item => {
    const matchesSearch = !searchTerm || 
      item.prompt_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.input_text?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTradition = selectedTradition === 'All' || item.philosophical_tradition === selectedTradition
    return matchesSearch && matchesTradition
  })
  
  const traditions = ['All', ...new Set(trainingData.map(item => item.philosophical_tradition).filter(Boolean))]

  useEffect(() => {
    loadJobs()
    loadTrainingData()
  }, [])

  const loadTrainingData = async () => {
    try {
      const res = await fetch('/api/virtue-ai/training-data')
      const data = await res.json()
      setTrainingData(data.data || [])
    } catch (error) {
      console.error('Error loading training data:', error)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item.id)
    setEditForm({
      input_text: item.input_text,
      output_text: item.output_text,
      notes: item.notes || ''
    })
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/virtue-ai/training-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem,
          ...editForm
        })
      })
      
      if (res.ok) {
        setEditingItem(null)
        loadTrainingData()
        alert('✅ Record updated successfully')
      }
    } catch (error) {
      alert('❌ Error updating record')
    }
  }

  const handleApprove = async (id, currentStatus) => {
    try {
      const res = await fetch('/api/virtue-ai/training-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_approved: !currentStatus
        })
      })
      
      if (res.ok) {
        loadTrainingData()
      }
    } catch (error) {
      alert('❌ Error updating approval status')
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this training record?')) {
      try {
        const res = await fetch('/api/virtue-ai/training-data', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })
        
        if (res.ok) {
          loadTrainingData()
          alert('✅ Record deleted successfully')
        }
      } catch (error) {
        alert('❌ Error deleting record')
      }
    }
  }

  const generateData = async () => {
    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      
      const res = await supabase.functions.invoke('virtue-ai-generator', {
        body: generationParams,
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (res.error) throw res.error
      const data = res.data

      
      console.log('API Response:', data)
      if (data && data.success) {
        alert(`✅ Generated ${data.samplesGenerated} training samples\nFile: ${data.fileName}`)
        loadTrainingData() // Refresh the data
      } else {
        alert(`❌ Error: ${JSON.stringify(data)}`)
        console.error('Full error:', data)
      }
    } catch (error) {
      alert('❌ Error: ' + error.message)
    }
    setGenerating(false)
  }

  const startFineTuning = async () => {
    setFineTuning(true)
    try {
      const res = await fetch('/api/virtue-ai/fine-tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonlFileName: 'virtue-training-latest.jsonl',
          modelDisplayName: `virtue-guide-${Date.now()}`
        })
      })
      const data = await res.json()
      
      if (data.success) {
        alert(`✅ Fine-tuning started\nJob ID: ${data.jobId}`)
        loadJobs()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      alert('❌ Error: ' + error.message)
    }
    setFineTuning(false)
  }

  const loadJobs = async () => {
    try {
      const res = await fetch('/api/virtue-ai/fine-tune')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  const testModel = async () => {
    try {
      const res = await fetch('/api/virtue-ai/inference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: testPrompt,
          modelEndpoint: selectedModel || undefined
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setResponse(data.response)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      alert('❌ Error: ' + error.message)
    }
  }

  const deployModel = async (jobName: string) => {
    try {
      // This would call a deploy endpoint
      alert(`🚀 Deploying model: ${jobName}`)
    } catch (error) {
      alert('❌ Error: ' + error.message)
    }
  }

  return (
    <div className="space-y-3">
      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="generate">Generate Data</TabsTrigger>
          <TabsTrigger value="review">Review & Combine</TabsTrigger>
          <TabsTrigger value="train">Fine-tune</TabsTrigger>
          <TabsTrigger value="test">Test Model</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Training Data</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trainingData.length}</div>
                <p className="text-xs text-muted-foreground">{trainingData.filter(item => item.is_approved).length} approved</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Generation Status</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generating ? 'Running' : 'Ready'}</div>
                <p className="text-xs text-muted-foreground">teacher model</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Training Data Generator</CardTitle>
              <CardDescription>Generate Socratic virtue guidance training data using Gemini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={generationParams.temperature}
                    onChange={(e) => setGenerationParams(prev => ({
                      ...prev,
                      temperature: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="numExamples">Number of Examples (ignored if custom prompt used)</Label>
                  <Input
                    id="numExamples"
                    type="number"
                    value={generationParams.numExamples}
                    onChange={(e) => setGenerationParams(prev => ({
                      ...prev,
                      numExamples: parseInt(e.target.value)
                    }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="promptName">Prompt Name</Label>
                  <Input
                    id="promptName"
                    value={generationParams.promptName}
                    onChange={(e) => setGenerationParams(prev => ({
                      ...prev,
                      promptName: e.target.value
                    }))}
                    placeholder="e.g., Aristotle-Honesty"
                  />
                </div>
                <div>
                  <Label htmlFor="tradition">Philosophical Tradition</Label>
                  <Input
                    id="tradition"
                    value={generationParams.philosophicalTradition}
                    onChange={(e) => setGenerationParams(prev => ({
                      ...prev,
                      philosophicalTradition: e.target.value
                    }))}
                    placeholder="e.g., Aristotelian, Stoic, Mussar"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="customPrompt">Custom Training Prompt (leave empty for default)</Label>
                <Textarea
                  id="customPrompt"
                  value={generationParams.customPrompt}
                  onChange={(e) => setGenerationParams(prev => ({
                    ...prev,
                    customPrompt: e.target.value
                  }))}
                  placeholder="Enter your complete prompt for generating training data"
                  className="h-32"
                />
              </div>
              
              <Button 
                onClick={generateData}
                disabled={generating}
                className="w-full"
              >
                {generating ? 'Generating Training Data...' : 'Generate Training Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="review">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trainingData.length}</div>
                <p className="text-xs text-muted-foreground">training pairs</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trainingData.filter(item => item.is_approved).length}</div>
                <p className="text-xs text-muted-foreground">ready for training</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filtered</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredData.length}</div>
                <p className="text-xs text-muted-foreground">current view</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Review & Combine Training Data</CardTitle>
              <CardDescription>Review generated training samples and combine them for fine-tuning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2">Training Data Records ({trainingData.length} total)</h4>
                <p className="text-sm text-gray-600 mb-4">Each generation creates database records. Search and filter to find specific training sets.</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Input
                      placeholder="Search by prompt name or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <select 
                      className="w-full p-2 border rounded"
                      value={selectedTradition}
                      onChange={(e) => setSelectedTradition(e.target.value)}
                    >
                      {traditions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredData.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No training data found</div>
                  ) : (
                    filteredData.map((item, i) => (
                      <div key={item.id} className={`p-3 rounded border ${
                        item.is_approved ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}>
                        {editingItem === item.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Input Text:</label>
                              <Textarea
                                value={editForm.input_text}
                                onChange={(e) => setEditForm(prev => ({ ...prev, input_text: e.target.value }))}
                                className="h-20"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Output Text:</label>
                              <Textarea
                                value={editForm.output_text}
                                onChange={(e) => setEditForm(prev => ({ ...prev, output_text: e.target.value }))}
                                className="h-24"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Notes:</label>
                              <Input
                                value={editForm.notes}
                                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Add notes about this training pair..."
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={handleSave}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <span className="font-medium">{item.prompt_name || `Record ${item.id}`}</span>
                                <div className="text-sm text-gray-500">
                                  {item.philosophical_tradition} • {new Date(item.created_at).toLocaleDateString()}
                                  {item.is_approved && <span className="ml-2 text-green-600 font-medium">✓ Approved</span>}
                                </div>
                                {item.notes && <div className="text-sm text-blue-600 mt-1">Note: {item.notes}</div>}
                              </div>
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => alert(`Input: ${item.input_text}\n\nOutput: ${item.output_text}`)}
                                >
                                  View
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant={item.is_approved ? "default" : "outline"}
                                  onClick={() => handleApprove(item.id, item.is_approved)}
                                  className={item.is_approved ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  {item.is_approved ? 'Approved' : 'Approve'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <div className="mb-1"><strong>Input:</strong> {item.input_text.substring(0, 100)}...</div>
                              <div><strong>Output:</strong> {item.output_text.substring(0, 100)}...</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Combine for Fine-tuning:</h4>
                  <p className="text-sm text-gray-600 mb-3">Select files to combine into a single training dataset:</p>
                  <Button className="w-full">Combine Selected Files → master-training-dataset.jsonl</Button>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Sample Preview:</h4>
                <div className="bg-white p-3 rounded border font-mono text-sm">
                  <div className="mb-2">{'{"input_text": "I procrastinate on important tasks", "output_text": "What do you think drives this delay? When you imagine completing the task, what feelings arise?"}'}</div>
                  <div>{'{"input_text": "I get angry easily", "output_text": "What happens in your body just before anger takes hold? What would courage look like in that moment?"}'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="train">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fine-tuning Jobs</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.length}</div>
                <p className="text-xs text-muted-foreground">{jobs.filter(j => j.state === 'SUCCEEDED').length} completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Training Status</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fineTuning ? 'Running' : 'Ready'}</div>
                <p className="text-xs text-muted-foreground">vertex ai</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fine-tuning Management</CardTitle>
                <CardDescription>Train custom virtue guidance models on Vertex AI</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={startFineTuning}
                  disabled={fineTuning}
                  className="mb-4"
                >
                  {fineTuning ? 'Starting Fine-tuning...' : 'Start New Fine-tuning Job'}
                </Button>
                
                <Button 
                  onClick={loadJobs}
                  variant="outline"
                  className="ml-2"
                >
                  Refresh Jobs
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fine-tuning Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.length > 0 ? jobs.map((job, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{job.displayName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            job.state === 'SUCCEEDED' ? 'default' :
                            job.state === 'RUNNING' ? 'secondary' :
                            job.state === 'FAILED' ? 'destructive' : 'outline'
                          }>
                            {job.state}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(job.createTime).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {job.state === 'SUCCEEDED' && (
                            <Button 
                              size="sm" 
                              onClick={() => deployModel(job.name)}
                            >
                              Deploy
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          No fine-tuning jobs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="test">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Models</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.filter(j => j.state === 'SUCCEEDED').length}</div>
                <p className="text-xs text-muted-foreground">deployed models</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Status</CardTitle>
                <TestTube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{response ? 'Complete' : 'Ready'}</div>
                <p className="text-xs text-muted-foreground">inference</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Model Testing</CardTitle>
              <CardDescription>Test your fine-tuned virtue guidance models</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="model-select">Model (leave empty for base Gemini)</Label>
                <Input
                  id="model-select"
                  placeholder="Enter model endpoint or leave empty"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="test-prompt">Character Defect Scenario</Label>
                <Textarea
                  id="test-prompt"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="e.g., I keep procrastinating on important tasks and feel guilty about it..."
                  className="h-24"
                />
              </div>
              
              <Button onClick={testModel} className="w-full">
                Get Virtue Guidance
              </Button>
              
              {response && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">AI Response:</h4>
                  <p className="whitespace-pre-wrap">{response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}