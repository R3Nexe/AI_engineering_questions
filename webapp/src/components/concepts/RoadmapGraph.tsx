'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { conceptStats } from '@/lib/progress'
import type { ConceptNode, Question, AttemptRecord, Video, VideoStatus } from '@/types'

interface Props {
  concepts: ConceptNode[]
  questions: Question[]
  attempts: AttemptRecord[]
  videos: Video[] | null
  videoProgress: Record<string, VideoStatus>
}

// ── Roadmap Tree Structure (DAG Tiers) ────────────────────────────────────────

interface RoadmapTier {
  id: string
  title: string
  nodes: string[]
}

const ROADMAP_TIERS: RoadmapTier[] = [
  { id: 'tier-0', title: 'Foundations', nodes: ['latency-metrics'] },
  { id: 'tier-1', title: 'Core Architecture', nodes: ['api-design', 'load-balancing', 'databases'] },
  { id: 'tier-2', title: 'Scale & Edge', nodes: ['rate-limiting', 'caching', 'cdn', 'replication'] },
  { id: 'tier-3', title: 'Distributed Data', nodes: ['scalability', 'sharding', 'durability'] },
  { id: 'tier-4', title: 'Coordination', nodes: ['consistency', 'concurrency'] },
  { id: 'tier-5', title: 'Async & Events', nodes: ['queues', 'stream-processing'] },
  { id: 'tier-6', title: 'Resilience', nodes: ['reliability', 'observability'] },
  { id: 'tier-7', title: 'AI Gateway', nodes: ['embeddings-vector-search'] },
  { id: 'tier-8', title: 'LLM & Retrieval', nodes: ['rag', 'llm-inference', 'fine-tuning'] },
  { id: 'tier-9', title: 'Autonomous Systems', nodes: ['agents', 'multimodal', 'evaluation'] },
]

// Directed edges connecting concepts in learning order
const ROADMAP_EDGES: [string, string][] = [
  // Foundations -> Core
  ['latency-metrics', 'api-design'],
  ['latency-metrics', 'load-balancing'],
  ['latency-metrics', 'databases'],

  // Core -> Scale & Edge
  ['api-design', 'rate-limiting'],
  ['load-balancing', 'caching'],
  ['load-balancing', 'cdn'],
  ['databases', 'replication'],

  // Scale -> Distributed Data
  ['rate-limiting', 'scalability'],
  ['caching', 'scalability'],
  ['replication', 'sharding'],
  ['replication', 'durability'],

  // Data -> Coordination
  ['sharding', 'consistency'],
  ['durability', 'concurrency'],

  // Coordination -> Async & Events
  ['scalability', 'queues'],
  ['consistency', 'queues'],
  ['consistency', 'stream-processing'],
  ['concurrency', 'stream-processing'],

  // Events -> Resilience
  ['queues', 'reliability'],
  ['stream-processing', 'observability'],

  // Resilience -> AI Gateway
  ['reliability', 'embeddings-vector-search'],
  ['observability', 'embeddings-vector-search'],

  // AI Gateway -> LLM & Retrieval
  ['embeddings-vector-search', 'rag'],
  ['embeddings-vector-search', 'llm-inference'],
  ['embeddings-vector-search', 'fine-tuning'],

  // Retrieval -> Autonomous Systems
  ['rag', 'agents'],
  ['llm-inference', 'multimodal'],
  ['rag', 'evaluation'],
  ['fine-tuning', 'evaluation'],
]

// Canvas layout constants
const NODE_WIDTH = 200
const NODE_HEIGHT = 70
const Y_GAP = 60
const CANVAS_WIDTH = 1080
const PADDING_TOP = 40
const TOTAL_CANVAS_HEIGHT = PADDING_TOP + ROADMAP_TIERS.length * (NODE_HEIGHT + Y_GAP) + 40

interface NodePosition {
  x: number
  y: number
  cx: number
  topY: number
  bottomY: number
  tierIndex: number
}

// Generate smooth cubic bezier SVG path between parent and child nodes
function generateCurvedPath(x1: number, y1: number, x2: number, y2: number): string {
  if (Math.abs(x1 - x2) < 2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }
  const midY = (y1 + y2) / 2
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
}

export default function RoadmapGraph({
  concepts,
  questions,
  attempts,
  videos,
  videoProgress,
}: Props) {
  const [zoom, setZoom] = useState(1)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Map of concept ID to ConceptNode
  const conceptMap = useMemo(() => {
    return new Map(concepts.map((c) => [c.id, c]))
  }, [concepts])

  // Calculate pixel positions for every node in the DAG
  const nodePositions = useMemo<Record<string, NodePosition>>(() => {
    const pos: Record<string, NodePosition> = {}

    ROADMAP_TIERS.forEach((tier, tierIdx) => {
      const count = tier.nodes.length
      const gap = 36
      const totalTierWidth = count * NODE_WIDTH + (count - 1) * gap
      const startX = (CANVAS_WIDTH - totalTierWidth) / 2
      const y = PADDING_TOP + tierIdx * (NODE_HEIGHT + Y_GAP)

      tier.nodes.forEach((nodeId, colIdx) => {
        const x = startX + colIdx * (NODE_WIDTH + gap)
        pos[nodeId] = {
          x,
          y,
          cx: x + NODE_WIDTH / 2,
          topY: y,
          bottomY: y + NODE_HEIGHT,
          tierIndex: tierIdx,
        }
      })
    })

    return pos
  }, [])

  // Calculate mastery stats for every concept
  const nodeStats = useMemo(() => {
    const statsMap: Record<string, { total: number; mastered: number; pct: number }> = {}
    concepts.forEach((c) => {
      const s = conceptStats(c.id, concepts, questions, attempts, videos ?? undefined, videoProgress)
      statsMap[c.id] = {
        total: s.total,
        mastered: s.mastered,
        pct: s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0,
      }
    })
    return statsMap
  }, [concepts, questions, attempts, videos, videoProgress])

  // Identify active connections when a node is hovered
  const connectedEdges = useMemo(() => {
    if (!hoveredNode) return new Set<string>()
    const active = new Set<string>()
    ROADMAP_EDGES.forEach(([from, to]) => {
      if (from === hoveredNode || to === hoveredNode) {
        active.add(`${from}->${to}`)
      }
    })
    return active
  }, [hoveredNode])

  // Zoom handlers
  const zoomIn = () => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))
  const zoomOut = () => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))
  const resetZoom = () => setZoom(1)

  return (
    <div className="relative flex-1 flex flex-col h-full bg-bg-deep overflow-hidden select-none">
      {/* Top Filter Bar */}
      <div className="shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-border-faint bg-bg-base/70 backdrop-blur-sm z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-text-dim uppercase tracking-wider mr-1">Filter:</span>
          {[
            { id: null, label: 'All Tracks' },
            { id: 'fundamentals', label: 'Fundamentals' },
            { id: 'data', label: 'Data & Storage' },
            { id: 'async', label: 'Async & Reliability' },
            { id: 'ai-systems', label: 'AI Systems' },
          ].map((cat) => {
            const active = selectedCategory === cat.id
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                  active
                    ? 'bg-accent-subtle text-accent border border-accent/40 font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-overlay'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        <div className="text-xs font-mono text-text-dim">
          24 concepts · 10 tiers
        </div>
      </div>

      {/* Main Roadmap Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-8 flex justify-center items-start"
      >
        <div
          className="relative transition-transform duration-150 origin-top"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${TOTAL_CANVAS_HEIGHT}px`,
            transform: `scale(${zoom})`,
          }}
        >
          {/* Tier Label Markers (Right side) */}
          {ROADMAP_TIERS.map((tier, idx) => {
            const y = PADDING_TOP + idx * (NODE_HEIGHT + Y_GAP) + NODE_HEIGHT / 2
            return (
              <div
                key={tier.id}
                className="absolute right-0 text-[11px] font-mono uppercase tracking-widest text-text-dim/40 pointer-events-none -translate-y-1/2"
                style={{ top: `${y}px` }}
              >
                {tier.title}
              </div>
            )
          })}

          {/* SVG Connecting Lines (Behind nodes) */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={CANVAS_WIDTH}
            height={TOTAL_CANVAS_HEIGHT}
          >
            <defs>
              <linearGradient id="edge-gradient-accent" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e8813c" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>

            {ROADMAP_EDGES.map(([fromId, toId]) => {
              const fromPos = nodePositions[fromId]
              const toPos = nodePositions[toId]
              if (!fromPos || !toPos) return null

              const edgeKey = `${fromId}->${toId}`
              const isHoveredEdge = connectedEdges.has(edgeKey)
              const fromStats = nodeStats[fromId]
              const isMasteredSource = fromStats && fromStats.mastered > 0

              const d = generateCurvedPath(fromPos.cx, fromPos.bottomY, toPos.cx, toPos.topY)

              let stroke = '#2a2f38'
              let strokeWidth = 2
              let opacity = 0.7

              if (isHoveredEdge) {
                stroke = '#e8813c'
                strokeWidth = 3
                opacity = 1
              } else if (isMasteredSource) {
                stroke = '#22c55e'
                strokeWidth = 2.5
                opacity = 0.85
              }

              return (
                <path
                  key={edgeKey}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={opacity}
                  className="transition-all duration-200"
                />
              )
            })}
          </svg>

          {/* Node Cards (NeetCode Style) */}
          {Object.entries(nodePositions).map(([nodeId, pos]) => {
            const concept = conceptMap.get(nodeId)
            if (!concept) return null

            const stats = nodeStats[nodeId] ?? { total: 0, mastered: 0, pct: 0 }
            const isHovered = hoveredNode === nodeId
            const isDimmed = selectedCategory !== null && concept.parentId !== selectedCategory
            const isFullyMastered = stats.total > 0 && stats.mastered === stats.total

            return (
              <div
                key={nodeId}
                className="absolute transition-all duration-200"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${NODE_HEIGHT}px`,
                  opacity: isDimmed ? 0.25 : 1,
                  zIndex: isHovered ? 30 : 10,
                }}
                onMouseEnter={() => setHoveredNode(nodeId)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <Link
                  href={`/concepts/${nodeId}`}
                  className={`group relative flex flex-col justify-between w-full h-full p-2.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isHovered
                      ? 'border-accent bg-bg-overlay shadow-[0_0_24px_rgba(232,129,60,0.22)] -translate-y-0.5'
                      : isFullyMastered
                        ? 'border-status-done/60 bg-[#16212b]'
                        : 'border-border-default bg-[#161a24] hover:border-border-strong hover:bg-bg-raised'
                  }`}
                >
                  {/* Card Header: Title + Mastered Check */}
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-sm font-semibold text-text-primary tracking-tight truncate group-hover:text-accent transition-colors">
                      {concept.name}
                    </span>
                    {isFullyMastered && (
                      <span className="text-xs text-status-done font-mono shrink-0">✓</span>
                    )}
                  </div>

                  {/* Bottom: Progress Bar + Counter (NeetCode Signature) */}
                  <div className="w-full space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-dim">
                      <span className="truncate">
                        {concept.parentId === 'fundamentals'
                          ? 'Fundamentals'
                          : concept.parentId === 'data'
                            ? 'Storage'
                            : concept.parentId === 'async'
                              ? 'Async'
                              : 'AI'}
                      </span>
                      <span className={stats.mastered > 0 ? 'text-status-done font-medium' : ''}>
                        {stats.mastered}/{stats.total}
                      </span>
                    </div>

                    {/* Green Bar (NeetCode Style) */}
                    <div className="h-2 w-full bg-bg-deep/80 border border-border-faint/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-done rounded-full transition-all duration-300"
                        style={{ width: `${stats.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute left-1/2 -top-2 -translate-x-1/2 -translate-y-full w-64 p-3 rounded-md bg-bg-raised border border-border-strong shadow-xl text-left pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="font-semibold text-xs text-text-primary mb-1">
                        {concept.name}
                      </div>
                      <p className="text-xs text-text-secondary leading-snug line-clamp-3 mb-2">
                        {concept.summary}
                      </p>
                      <div className="pt-2 border-t border-border-faint flex items-center justify-between text-[11px] font-mono text-text-dim">
                        <span>{stats.mastered} of {stats.total} mastered</span>
                        <span className="text-accent">Open →</span>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Bottom-Right Zoom & Pan Controls */}
      <div className="absolute bottom-5 right-6 flex items-center gap-1 bg-bg-raised/90 backdrop-blur-md border border-border-default rounded-md p-1 shadow-lg z-20 font-mono text-xs">
        <button
          onClick={zoomOut}
          aria-label="Zoom out"
          className="size-7 flex items-center justify-center rounded hover:bg-bg-overlay text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-sm"
        >
          -
        </button>
        <button
          onClick={resetZoom}
          aria-label="Reset zoom"
          className="px-2 h-7 flex items-center justify-center rounded hover:bg-bg-overlay text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-xs"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          aria-label="Zoom in"
          className="size-7 flex items-center justify-center rounded hover:bg-bg-overlay text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-sm"
        >
          +
        </button>
      </div>
    </div>
  )
}
