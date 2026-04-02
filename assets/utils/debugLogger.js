/**
 * DebugLogger – Narzędzie diagnostyczne render-loop & FPS
 * Wszystko gated za __DEV__, w produkcji = no-op.
 */

import { useEffect, useRef, useCallback } from 'react'

const ENABLED = __DEV__
const TAG = '[DBG]'

// ─── Render counter ──────────────────────────────────────────────────────

const renderCounts = {}
const floodThreshold = 10 // ile renderów/sekundę = flood
const floodWindow = 1000 // ms

/**
 * Zlicza renderowania komponentu. Loguje ostrzeżenie przy > floodThreshold/s.
 */
export const dbg = (componentName) => {
  if (!ENABLED) return

  const now = Date.now()
  if (!renderCounts[componentName]) {
    renderCounts[componentName] = { count: 0, windowStart: now, total: 0 }
  }

  const entry = renderCounts[componentName]
  entry.count++
  entry.total++

  if (now - entry.windowStart > floodWindow) {
    if (entry.count > floodThreshold) {
      console.warn(
        `${TAG} 🔴 RENDER FLOOD: ${componentName} rendered ${entry.count}x in ${floodWindow}ms (total: ${entry.total})`
      )
    }
    entry.count = 0
    entry.windowStart = now
  } else if (entry.total <= 3 || entry.total % 10 === 0) {
    console.log(`${TAG} render #${entry.total} ${componentName}`)
  }
}

// ─── Hook: useDebugMount ─────────────────────────────────────────────────

/**
 * Loguje mount/unmount komponentu.
 */
export const useDebugMount = (componentName) => {
  useEffect(() => {
    if (!ENABLED) return
    console.log(`${TAG} ✅ MOUNT ${componentName}`)
    return () => {
      console.log(`${TAG} ❌ UNMOUNT ${componentName}`)
    }
  }, [componentName])
}

// ─── Hook: useDebugEffect ────────────────────────────────────────────────

/**
 * Loguje kiedy efekt się odpala + które deps się zmieniły.
 * Użycie: useDebugEffect('MapContext:checkPermissions', [dep1, dep2], ['dep1', 'dep2'])
 */
export const useDebugEffect = (effectName, deps = [], depNames = []) => {
  const prevDeps = useRef(null)
  const runCount = useRef(0)

  useEffect(() => {
    if (!ENABLED) return

    runCount.current++

    if (prevDeps.current === null) {
      console.log(`${TAG} 🔄 EFFECT ${effectName} – initial run`)
      prevDeps.current = [...deps]
      return
    }

    const changed = []
    for (let i = 0; i < deps.length; i++) {
      if (!Object.is(deps[i], prevDeps.current[i])) {
        changed.push(
          `${depNames[i] || `dep[${i}]`}: ${JSON.stringify(prevDeps.current[i])} → ${JSON.stringify(deps[i])}`
        )
      }
    }

    if (changed.length > 0) {
      console.log(`${TAG} 🔄 EFFECT ${effectName} #${runCount.current} – changed: ${changed.join(', ')}`)
    }
    // Silent when no deps changed (just a parent re-render)

    prevDeps.current = [...deps]
  })
}

// ─── logState ────────────────────────────────────────────────────────────

/**
 * Loguje zmianę stanu.
 */
export const logState = (componentName, stateName, value) => {
  if (!ENABLED) return
  console.log(`${TAG} setState ${componentName}.${stateName} =`, typeof value === 'object' ? JSON.stringify(value) : value)
}

// ─── HTTP timing (dla customFetch interceptors) ──────────────────────────

/**
 * Loguje czas trwania HTTP requestu.
 */
export const logHttp = (method, url, durationMs, status) => {
  if (!ENABLED) return
  const icon = durationMs > 2000 ? '🐌' : durationMs > 500 ? '⚠️' : '⚡'
  console.log(`${TAG} ${icon} HTTP ${method} ${url} → ${status} (${durationMs}ms)`)
}

// ─── Socket event logger ─────────────────────────────────────────────────

export const logSocket = (direction, eventName, data) => {
  if (!ENABLED) return
  console.log(
    `${TAG} 🔌 SOCKET ${direction === 'in' ? '⬇' : '⬆'} ${eventName}`,
    data ? JSON.stringify(data).substring(0, 200) : ''
  )
}

// ─── Provider render tracker ─────────────────────────────────────────────

/**
 * Śledzi ile razy provider się renderuje. Zwraca render count.
 */
export const useProviderRenderCount = (providerName) => {
  const count = useRef(0)
  count.current++

  useEffect(() => {
    if (!ENABLED) return
    if (count.current > 1) {
      console.log(`${TAG} 🏗️ PROVIDER ${providerName} render #${count.current}`)
    }
  })

  return count.current
}

// ─── Timer helpers ───────────────────────────────────────────────────────

const timers = {}

export const timerStart = (label) => {
  if (!ENABLED) return
  timers[label] = Date.now()
}

export const timerEnd = (label) => {
  if (!ENABLED) return
  if (!timers[label]) return
  const elapsed = Date.now() - timers[label]
  console.log(`${TAG} ⏱️ ${label}: ${elapsed}ms`)
  delete timers[label]
}

// ─── Summary dump (po 5s) ────────────────────────────────────────────────

let summaryScheduled = false

export const scheduleSummary = (delaySec = 5) => {
  if (!ENABLED || summaryScheduled) return
  summaryScheduled = true

  setTimeout(() => {
    console.log(`\n${TAG} ═══════════════════════════════════════════`)
    console.log(`${TAG} RENDER SUMMARY after ${delaySec}s:`)
    const sorted = Object.entries(renderCounts).sort((a, b) => b[1].total - a[1].total)
    for (const [name, data] of sorted) {
      const icon = data.total > 20 ? '🔴' : data.total > 5 ? '🟡' : '🟢'
      console.log(`${TAG}  ${icon} ${name}: ${data.total} renders`)
    }
    console.log(`${TAG} ═══════════════════════════════════════════\n`)
    summaryScheduled = false
  }, delaySec * 1000)
}
