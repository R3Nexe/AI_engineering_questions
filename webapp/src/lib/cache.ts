'use client'

import { useEffect, useSyncExternalStore } from 'react'

/**
 * Client-side cache for server content, persisted in IndexedDB.
 *
 * Reads are cache-first. A hit paints immediately, even when stale. If the entry is
 * older than the resource TTL, one background request refreshes it and every
 * subscriber updates. Concurrent requests for the same key share one fetch.
 *
 * Bump CACHE_VERSION when the shape of any cached value changes. Old entries are
 * then ignored and refetched.
 */
const CACHE_VERSION = 1
const DB_NAME = 'aiprep-content'
const STORE = 'kv'

export interface Resource<T> {
  key: string
  /** Entries older than this are refreshed in the background. */
  ttlMs: number
  fetch: () => Promise<T>
}

interface Entry<T> {
  data: T
  fetchedAt: number
}

const mem = new Map<string, Entry<unknown>>()
const inflight = new Map<string, Promise<Entry<unknown>>>()
const subscribers = new Map<string, Set<() => void>>()

// ── IndexedDB (best effort: private mode or quota errors just skip persistence) ──

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    const { promise, resolve, reject } = Promise.withResolvers<IDBDatabase>()
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    dbPromise = promise
  }
  return dbPromise
}

async function idbGet<T>(key: string): Promise<Entry<T> | undefined> {
  try {
    const db = await openDb()
    const { promise, resolve, reject } = Promise.withResolvers<Entry<T> | undefined>()
    const req = db.transaction(STORE).objectStore(STORE).get(`${CACHE_VERSION}:${key}`)
    req.onsuccess = () => resolve(req.result as Entry<T> | undefined)
    req.onerror = () => reject(req.error)
    return await promise
  } catch {
    return undefined
  }
}

async function idbSet<T>(key: string, entry: Entry<T>): Promise<void> {
  try {
    const db = await openDb()
    const { promise, resolve, reject } = Promise.withResolvers<void>()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(entry, `${CACHE_VERSION}:${key}`)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    await promise
  } catch {
    // Persistence is an optimisation; the in-memory entry is already set.
  }
}

// ── Core ──────────────────────────────────────────────────────────────────────

function notify(key: string) {
  subscribers.get(key)?.forEach((cb) => cb())
}

function addSubscriber(key: string, cb: () => void): () => void {
  const set = subscribers.get(key) ?? new Set<() => void>()
  set.add(cb)
  subscribers.set(key, set)
  return () => set.delete(cb)
}

/** Calls `cb` with fresh data each time the resource is (re)loaded. */
export function subscribeResource<T>(res: Resource<T>, cb: (data: T) => void): () => void {
  return addSubscriber(res.key, () => {
    const e = mem.get(res.key) as Entry<T> | undefined
    if (e) cb(e.data)
  })
}

function revalidate<T>(res: Resource<T>): Promise<Entry<T>> {
  const existing = inflight.get(res.key)
  if (existing) return existing as Promise<Entry<T>>
  const p = res
    .fetch()
    .then((data) => {
      const entry: Entry<T> = { data, fetchedAt: Date.now() }
      mem.set(res.key, entry)
      void idbSet(res.key, entry)
      notify(res.key)
      return entry
    })
    .finally(() => inflight.delete(res.key))
  inflight.set(res.key, p)
  return p
}

async function readEntry<T>(res: Resource<T>): Promise<Entry<T> | undefined> {
  const hit = mem.get(res.key) as Entry<T> | undefined
  if (hit) return hit
  const stored = await idbGet<T>(res.key)
  // A fetch may have completed while IndexedDB was opening; never overwrite it.
  if (stored && !mem.has(res.key)) {
    mem.set(res.key, stored)
    notify(res.key)
  }
  return mem.get(res.key) as Entry<T> | undefined
}

/**
 * Cache-first load. Resolves from cache when present, starting a background refresh
 * if stale. With nothing cached it waits for the network and rejects if that fails.
 */
export async function loadResource<T>(res: Resource<T>): Promise<T> {
  const hit = await readEntry(res)
  if (hit) {
    if (Date.now() - hit.fetchedAt > res.ttlMs) revalidate(res).catch(logRefreshError(res))
    return hit.data
  }
  return (await revalidate(res)).data
}

function logRefreshError<T>(res: Resource<T>) {
  return (err: unknown) => console.error(`[cache] refresh of "${res.key}" failed`, err)
}

/** React hook over a resource. Returns null until data is available. */
export function useResource<T>(res: Resource<T>): T | null {
  const data = useSyncExternalStore(
    (cb) => addSubscriber(res.key, cb),
    () => (mem.get(res.key) as Entry<T> | undefined)?.data ?? null,
    () => null,
  )

  useEffect(() => {
    loadResource(res).catch(logRefreshError(res))
  }, [res])

  return data
}
