'use client'

import { useState } from 'react'
import type { RefObject } from 'react'
import dynamic from 'next/dynamic'
import VideoNotes from './VideoNotes'
import { Tabs } from '@/components/ui'

// Excalidraw must not run on the server — canvas APIs unavailable during SSR.
const WhiteboardPanel = dynamic(() => import('@/components/WhiteboardPanel'), {
  ssr: false,
})

type TabId = 'notes' | 'whiteboard'

interface Props {
  videoId: string
  iframeRef: RefObject<HTMLIFrameElement | null>
}

const TABS = [
  { id: 'notes', label: 'Notes' },
  { id: 'whiteboard', label: 'Whiteboard' },
]

export default function VideoSidebar({ videoId, iframeRef }: Props) {
  const [tab, setTab] = useState<TabId>('notes')

  return (
    <div className="flex flex-col h-full bg-bg-deep">
      <Tabs
        tabs={TABS}
        activeTab={tab}
        onTabChange={(id) => setTab(id as TabId)}
      />

      {/* Both panels mounted; display toggled via CSS to preserve whiteboard state */}
      <div
        id="tabpanel-notes"
        role="tabpanel"
        aria-labelledby="tab-notes"
        className={`flex-1 min-h-0 ${tab === 'notes' ? 'flex flex-col' : 'hidden'}`}
      >
        <VideoNotes key={videoId} videoId={videoId} iframeRef={iframeRef} />
      </div>

      <div
        id="tabpanel-whiteboard"
        role="tabpanel"
        aria-labelledby="tab-whiteboard"
        className={`flex-1 min-h-0 ${tab === 'whiteboard' ? 'block' : 'hidden'}`}
      >
        <WhiteboardPanel storageKey={`wb_video_${videoId}`} />
      </div>
    </div>
  )
}
