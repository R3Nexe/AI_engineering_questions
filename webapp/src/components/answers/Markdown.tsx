'use client'

import { useMemo } from 'react'
import { marked } from 'marked'

interface Props {
  content: string
  className?: string
}

export default function Markdown({ content, className = '' }: Props) {
  const html = useMemo(() => {
    if (!content) return ''
    const renderer = new marked.Renderer()
    const originalLink = renderer.link.bind(renderer)
    renderer.link = function (token) {
      const href = typeof token === 'string' ? token : token.href
      const res = originalLink.call(this, token)
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        return res.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')
      }
      return res
    }

    return marked.parse(content, {
      gfm: true,
      breaks: true,
      renderer,
    }) as string
  }, [content])

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
