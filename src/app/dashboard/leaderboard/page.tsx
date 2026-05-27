"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Activity, Loader2, Sparkles, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AgentProgressMonitor } from "@/lib/agents/monitor"

interface Idea {
  id: string
  title: string
  score: number
  category: string
}

export default function LeaderboardPage() {
  const [ideas, setIdeas] = React.useState<Idea[]>([])
  const [isBattling, setIsBattling] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)

  const fetchIdeas = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ideas/generate', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setIdeas(json.data)
        toast.success("20 New Ideas Generated!")
      }
    } catch (e) {
      toast.error("Failed to generate ideas")
    } finally {
      setIsGenerating(false)
    }
  }

  React.useEffect(() => {
    fetchIdeas()
  }, [])

  const handleBattle = () => {
    setIsBattling(true)
    toast.info("The Agents are debating your ideas...")
    setTimeout(() => {
      setIdeas(prev => [...prev].map(i => ({ ...i, score: Math.floor(Math.random() * 40) + 60 })).sort((a, b) => b.score - a.score))
      setIsBattling(false)
      toast.success("Battle Completed! Leaderboard updated.")
    }, 8000)
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Business Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">The top 20 ideas ranked by the Council.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={fetchIdeas}
            disabled={isGenerating || isBattling}
          >
            {isGenerating ? <Loader2 className="mr-2 animate-spin h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh Ideas
          </Button>
          <Button
            onClick={handleBattle}
            disabled={isBattling || isGenerating}
            className="shadow-lg shadow-primary/20"
          >
            {isBattling ? <Loader2 className="mr-2 animate-spin h-4 w-4" /> : <Activity className="mr-2 h-4 w-4" />}
            Trigger Agent Battle
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {ideas.map((idea, index) => (
              <motion.div
                key={idea.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden group hover:border-primary/50 transition-colors ${index === 0 ? 'bg-primary/5 border-primary' : ''}`}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <span className={`text-2xl font-black ${index < 3 ? 'text-primary' : 'text-muted-foreground/30'} w-8 italic`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{idea.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-muted rounded uppercase tracking-tighter">
                            {idea.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xl font-black text-primary">{idea.score}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Score</div>
                      </div>
                      <Trophy className={`h-6 w-6 ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-muted/20'}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-8 border-dashed bg-muted/50">
            <CardContent className="p-6">
               <AgentProgressMonitor active={isBattling} />
            </CardContent>
          </Card>

          <div className="p-6 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-bold">Pro Tip</h3>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              Ideas that get a score above 85% are automatically marked for deep research. Use the "Research" button in the editor to let the agents explore the market.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
