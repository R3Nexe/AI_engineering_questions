'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import type { Question, SelfGrade } from '@/types'
import {
  Button,
  DifficultyMark,
  Tabs,
  Kbd,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui'
import { useShell } from '@/components/shell'
import Markdown from '@/components/answers/Markdown'

interface Props {
  question: Question
}

type TimerState = 'idle' | 'running' | 'paused'
type TabId = 'prompt' | 'answer' | 'scratchpad' | 'notes' | 'review'
interface SpeechResultList {
  readonly length: number
  [index: number]: {
    readonly [index: number]: {
      readonly transcript: string
    }
  }
}

interface CustomSpeechEvent extends Event {
  resultIndex: number
  results: SpeechResultList
}

interface CustomSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  onresult: ((e: CustomSpeechEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

interface CustomWindow extends Window {
  SpeechRecognition?: { new (): CustomSpeechRecognition }
  webkitSpeechRecognition?: { new (): CustomSpeechRecognition }
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function InterviewView({ question }: Props) {
  const router = useRouter()
  const { saveDraft, clearDraft, recordAttempt } = useStore()
  const initDraft = useStore.getState().drafts[question.id]
  const [, startTransition] = useTransition()

  const [answer, setAnswer] = useState(initDraft?.answer ?? '')
  const [scratchpad, setScratchpad] = useState(initDraft?.scratchpad ?? '')
  const [notes, setNotes] = useState(initDraft?.notes ?? '')
  const [elapsed, setElapsed] = useState(initDraft?.elapsedSeconds ?? 0)
  const [submitted, setSubmitted] = useState(initDraft?.submitted ?? false)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [activeTab, setActiveTab] = useState<TabId>(initDraft?.submitted ? 'review' : 'prompt')
  const [keyPointsHit, setKeyPointsHit] = useState<Set<string>>(new Set(initDraft?.keyPointsHit ?? []))
  const [isRecording, setIsRecording] = useState(false)
  const [answerMode, setAnswerMode] = useState<'write' | 'preview'>('write')
  const { setStatusHints } = useShell()

  const recognitionRef = useRef<CustomSpeechRecognition | null>(null)

  // Register keyboard hints in the shell status bar
  useEffect(() => {
    setStatusHints([
      { key: 'Space', label: 'start/pause' },
      { key: 'r', label: 'restart' },
      { key: '⌘↵', label: 'submit' },
    ])
    return () => setStatusHints([])
  }, [setStatusHints])

  // Timer interval
  useEffect(() => {
    if (timerState !== 'running') return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [timerState])

  // Autosave draft (debounced 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft({
        questionId: question.id,
        answer,
        scratchpad,
        notes,
        elapsedSeconds: elapsed,
        submitted,
        keyPointsHit: Array.from(keyPointsHit),
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [answer, scratchpad, notes, elapsed, submitted, keyPointsHit, question.id, saveDraft])

  const handleSubmit = () => {
    setSubmitted(true)
    setTimerState('paused')
    setActiveTab('review')
  }

  // Global keyboard shortcuts (Cmd+Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!submitted && answer.trim()) {
          handleSubmit()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitted, answer])

  // Timer controls
  const toggleTimer = () => {
    setTimerState((prev) => (prev === 'running' ? 'paused' : 'running'))
  }

  const handleRestart = () => {
    if (confirm('Restart interview? This clears your answer, scratchpad, and timer.')) {
      setTimerState('idle')
      setElapsed(0)
      setAnswer('')
      setScratchpad('')
      setNotes('')
      setSubmitted(false)
      setKeyPointsHit(new Set())
      setActiveTab('prompt')
      clearDraft(question.id)
    }
  }
  const handleGrade = (grade: SelfGrade) => {
    recordAttempt({
      id: Date.now().toString(),
      questionId: question.id,
      date: new Date().toISOString(),
      grade,
      durationSeconds: elapsed,
    })
    clearDraft(question.id)
    startTransition(() => {
      router.push('/')
    })
  }

  // Web Speech API dictation
  const toggleDictation = () => {
    const customWindow = window as unknown as CustomWindow
    const SpeechRec = customWindow.SpeechRecognition || customWindow.webkitSpeechRecognition

    if (!SpeechRec) {
      alert('Speech Recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const rec = new SpeechRec()
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e: CustomSpeechEvent) => {
      const results = e.results
      let text = ''
      for (let i = e.resultIndex; i < results.length; i++) {
        text += (text ? ' ' : '') + results[i][0].transcript
      }
      setAnswer((prev) => prev + (prev ? ' ' : '') + text)
    }
    rec.onend = () => setIsRecording(false)
    rec.start()
    recognitionRef.current = rec
    setIsRecording(true)
  }

  const timeLimitSecs = question.timeLimitMinutes * 60
  const overLimit = elapsed > timeLimitSecs
  const warning = elapsed >= timeLimitSecs * 0.8
  const timerColor = overLimit ? 'text-diff-hard' : warning ? 'text-diff-medium' : 'text-text-primary'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-base">
      <Tabs
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
        tabs={[
          { id: 'prompt', label: 'prompt.md' },
          { id: 'answer', label: 'answer.md', dirty: answer.length > 0 },
          { id: 'scratchpad', label: 'scratch.md', dirty: scratchpad.length > 0 },
          { id: 'notes', label: 'notes.md', dirty: notes.length > 0 },
          ...(submitted ? [{ id: 'review', label: 'review.md' }] : []),
        ]}
      />

      {/* Main editor content area */}
      <div className="flex-1 overflow-y-auto p-6 bg-bg-deep text-text-primary">
        {activeTab === 'prompt' && (
          <div className="max-w-[62ch] space-y-4">
            <h1 className="text-lg font-semibold text-text-primary">{question.title}</h1>
            <div className="flex items-center gap-2 text-xs font-mono text-text-secondary pb-4 border-b border-border-faint">
              <DifficultyMark difficulty={question.difficulty} />
              <span>·</span>
              <span>{question.timeLimitMinutes} min limit</span>
              <span>·</span>
              <span>{question.category}</span>
            </div>
            <div className="prose prose-invert max-w-none text-sm leading-relaxed">
              <Markdown content={question.prompt} />
            </div>
          </div>
        )}

        {activeTab === 'answer' && (
          <div className="flex flex-col h-full space-y-2 max-w-[75ch]">
            <div className="flex items-center justify-between pb-2 border-b border-border-faint">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-text-dim">Your Answer</span>
                <div className="flex items-center bg-bg-raised rounded p-0.5 border border-border-faint text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setAnswerMode('write')}
                    className={`px-2 py-0.5 rounded transition-colors ${answerMode === 'write' ? 'bg-bg-overlay text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerMode('preview')}
                    className={`px-2 py-0.5 rounded transition-colors ${answerMode === 'preview' ? 'bg-bg-overlay text-text-primary font-medium' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Preview
                  </button>
                </div>
              </div>
              <Button
                variant={isRecording ? 'primary' : 'ghost'}
                size="sm"
                onClick={toggleDictation}
                className={isRecording ? 'animate-pulse' : ''}
              >
                {isRecording ? '● Recording…' : '🎤 Dictate'}
              </Button>
            </div>
            {answerMode === 'write' ? (
              <textarea
                className="flex-1 w-full bg-transparent font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder:text-text-dim text-text-primary"
                placeholder="Type or dictate your answer here (Markdown supported)..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            ) : (
              <div className="flex-1 w-full overflow-y-auto p-2">
                {answer.trim() ? (
                  <Markdown content={answer} />
                ) : (
                  <span className="text-xs font-mono text-text-dim italic">Nothing to preview yet. Switch to Write to draft your answer.</span>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'scratchpad' && (
          <div className="flex flex-col h-full space-y-2 max-w-[75ch]">
            <div className="text-xs font-mono text-text-dim pb-2 border-b border-border-faint">
              Scratchpad (calculations, estimates, rough formulas)
            </div>
            <textarea
              className="flex-1 w-full bg-transparent font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder:text-text-dim text-text-primary"
              placeholder="Rough notes, capacity math, data structures..."
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
            />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="flex flex-col h-full space-y-2 max-w-[75ch]">
            <div className="text-xs font-mono text-text-dim pb-2 border-b border-border-faint">
              Interview Notes (observations, trade-offs, interviewer cues)
            </div>
            <textarea
              className="flex-1 w-full bg-transparent font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder:text-text-dim text-text-primary"
              placeholder="Notes to remember..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        {activeTab === 'review' && (
          <div className="max-w-[72ch] space-y-6">
            <Card className="bg-bg-base border-border-default shadow-none">
              <CardHeader className="p-0 space-y-1">
                <CardTitle className="text-md font-semibold text-text-primary">Self Evaluation</CardTitle>
                <CardDescription className="text-xs text-text-secondary">
                  Review the reference answer below, check off the key points you hit, then rate your performance:
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleGrade(0)}>
                    Missed it (1)
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleGrade(1)}>
                    Shaky (2)
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleGrade(2)}>
                    Solid (3)
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleGrade(3)}>
                    Nailed it (4)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {question.keyPoints.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary">Key Points Checklist</h3>
                <div className="space-y-1.5 border border-border-faint rounded-md p-3 bg-bg-base">
                  {question.keyPoints.map((kp, idx) => {
                    const checked = keyPointsHit.has(kp)
                    return (
                      <label key={idx} className="flex items-start gap-2.5 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = new Set(keyPointsHit)
                            if (checked) next.delete(kp)
                            else next.add(kp)
                            setKeyPointsHit(next)
                          }}
                          className="mt-0.5 rounded-sm border-border-default bg-bg-raised text-accent focus:ring-0"
                        />
                        <span className={checked ? 'line-through text-text-dim' : ''}>{kp}</span>
                      </label>
                    )
                  })}
                </div>
              </section>
            )}
            {answer.trim() && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary">Your Submitted Answer</h3>
                <div className="p-4 bg-bg-base border border-border-default rounded-md text-sm">
                  <Markdown content={answer} />
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary">Expected Answer</h3>
              <div className="p-4 bg-bg-base border border-border-default rounded-md text-sm">
                <Markdown content={question.expectedAnswer} />
              </div>
            </section>

            {question.followUps.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary">Follow-up Questions</h3>
                <ol className="space-y-1.5 text-xs font-mono">
                  {question.followUps.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-text-dim">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-text-primary font-sans">{f}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Bottom interview status strip */}
      <div className="border-t border-border-default bg-bg-raised px-4 py-2 flex items-center gap-4 shrink-0">
        <div className={`text-base font-mono tabular-nums ${timerColor}`}>
          {fmtTime(elapsed)} / {fmtTime(timeLimitSecs)}
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={toggleTimer}>
            {timerState === 'running' ? 'Pause' : timerState === 'paused' ? 'Resume' : 'Start'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRestart}>
            Reset
          </Button>
        </div>

        <div className="h-4 w-px bg-border-faint" />
        <DifficultyMark difficulty={question.difficulty} />

        <div className="ml-auto flex items-center gap-2">
          {!submitted && (
            <Button
              variant="primary"
              size="sm"
              disabled={!answer.trim()}
              onClick={handleSubmit}
            >
              Submit <Kbd className="ml-1.5 text-xs">⌘↵</Kbd>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" aria-label="More session options">
                  •••
                </Button>
              }
            />
            <DropdownMenuContent
              align="end"
              className="bg-bg-raised border border-border-default text-text-primary p-1 rounded-md shadow-lg min-w-48"
            >
              <DropdownMenuItem
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(question.prompt)
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-mono rounded cursor-pointer hover:bg-bg-overlay"
              >
                Copy Question Prompt
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 border-t border-border-faint" />
              <DropdownMenuItem
                onClick={handleRestart}
                className="px-2.5 py-1.5 text-xs font-mono rounded cursor-pointer hover:bg-bg-overlay text-diff-hard"
              >
                Reset Session <Kbd className="ml-auto text-[10px]">r</Kbd>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
