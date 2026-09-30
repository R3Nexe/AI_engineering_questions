'use client'

import { useParams, notFound } from 'next/navigation'
import InterviewView from '@/components/InterviewView'
import WhiteboardPanel from '@/components/WhiteboardPanel'
import { useStore } from '@/store'
import ResizableSplit from '@/components/ResizableSplit'
import { Spinner } from '@/components/ui'

export default function Page() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? '')
  const pack = useStore((s) => s.pack)
  const question = pack?.questions.find((q) => q.id === id)

  if (!question) {
    if (!pack) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-bg-deep text-text-dim font-mono text-xs gap-2">
          <Spinner className="size-4 text-accent" />
          <span>loading question...</span>
        </div>
      )
    }
    notFound()
  }

  return (
    <div className="h-full w-full bg-bg-deep">
      <ResizableSplit
        storageKey={`split_q_${id}`}
        initialRightPct={40}
        left={<InterviewView question={question} />}
        right={<WhiteboardPanel storageKey={`wb_${id}`} />}
      />
    </div>
  )
}
