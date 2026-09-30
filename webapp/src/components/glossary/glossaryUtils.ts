/**
 * Smoothly scrolls to a term card by id and briefly highlights it
 * with an accent glow via the Web Animations API.
 */
export function flashAndScroll(id: string): void {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.animate(
    [
      { backgroundColor: 'rgba(232, 129, 60, 0.18)' },
      { backgroundColor: 'transparent' },
    ],
    { duration: 1400, easing: 'ease-out' },
  )
}
