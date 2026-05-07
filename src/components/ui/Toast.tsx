import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastVariant = 'default' | 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  title?: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastApi {
  show: (msg: string, opts?: { title?: string; variant?: ToastVariant; duration?: number }) => void
  success: (msg: string, opts?: { title?: string; duration?: number }) => void
  error: (msg: string, opts?: { title?: string; duration?: number }) => void
  info: (msg: string, opts?: { title?: string; duration?: number }) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((cur) => cur.filter((t) => t.id !== id))
  }, [])

  const show = useCallback<ToastApi['show']>((message, opts) => {
    idRef.current += 1
    const item: ToastItem = {
      id: idRef.current,
      title: opts?.title,
      message,
      variant: opts?.variant ?? 'default',
      duration: opts?.duration ?? 3200,
    }
    setItems((cur) => [...cur.slice(-2), item])
  }, [])

  const api = useMemo<ToastApi>(() => ({
    show,
    success: (m, o) => show(m, { ...o, variant: 'success' }),
    error: (m, o) => show(m, { ...o, variant: 'error' }),
    info: (m, o) => show(m, { ...o, variant: 'info' }),
    dismiss,
  }), [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      dismiss: () => {},
    }
  }
  return ctx
}

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-4"
      style={{ bottom: 'calc(var(--tabbar-total) + 90px)' }}
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const id = window.setTimeout(() => onDismiss(item.id), item.duration)
    return () => window.clearTimeout(id)
  }, [item.id, item.duration, onDismiss])

  const Icon =
    item.variant === 'success'
      ? CheckCircle2
      : item.variant === 'error'
      ? AlertTriangle
      : Info

  const accent =
    item.variant === 'success'
      ? 'text-[var(--color-accent-500)]'
      : item.variant === 'error'
      ? 'text-red-500'
      : 'text-[var(--color-primary-500)]'

  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 600) {
      onDismiss(item.id)
    }
  }

  return (
    <motion.div
      role="status"
      aria-live="polite"
      drag="x"
      dragElastic={0.2}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96, transition: { duration: 0.12 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className={cn(
        'pointer-events-auto flex w-full max-w-[460px] items-start gap-3 rounded-2xl bg-[var(--color-surface-elevated)]/95 px-4 py-3 shadow-[var(--shadow-pop)] ring-1 ring-[var(--color-hairline)] backdrop-blur-xl',
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', accent)} />
      <div className="min-w-0 flex-1">
        {item.title && <div className="text-sm font-semibold tracking-tight">{item.title}</div>}
        <div className="text-[13px] text-[var(--color-on-surface)] [overflow-wrap:anywhere]">{item.message}</div>
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="-mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-on-surface-muted)] transition-colors active:bg-[var(--color-surface-dim)]"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </motion.div>
  )
}
