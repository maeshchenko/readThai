import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLockBody } from '@/hooks/useLockBody'

interface Props {
  open: boolean
  onClose: () => void
  title?: ReactNode
  trailing?: ReactNode
  children: ReactNode
  size?: 'auto' | 'half' | 'full'
  hideCloseButton?: boolean
  className?: string
  ariaLabel?: string
}

const SIZE_MAP: Record<NonNullable<Props['size']>, string> = {
  auto: 'max-h-[88dvh]',
  half: 'h-[60dvh]',
  full: 'h-[94dvh]',
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function BottomSheet({
  open,
  onClose,
  title,
  trailing,
  children,
  size = 'auto',
  hideCloseButton,
  className,
  ariaLabel,
}: Props) {
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useLockBody(open)

  // Focus management + key handling
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Focus the sheet itself
    requestAnimationFrame(() => {
      const node = sheetRef.current
      if (!node) return
      const focusable = node.querySelector<HTMLElement>(FOCUSABLE)
      if (focusable) focusable.focus()
      else node.focus()
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const node = sheetRef.current
      if (!node) return
      const list = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
      )
      if (list.length === 0) {
        e.preventDefault()
        node.focus()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        try { previouslyFocused.focus() } catch { /* noop */ }
      }
    }
  }, [open, onClose])

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? undefined : ariaLabel}
            aria-labelledby={typeof title === 'string' ? titleId : undefined}
            tabIndex={-1}
            className={cn(
              'fixed inset-x-0 bottom-0 z-[81] flex flex-col rounded-t-3xl bg-[var(--color-surface-elevated)] shadow-[var(--shadow-pop)] outline-none',
              'pl-safe pr-safe',
              SIZE_MAP[size],
              className,
            )}
            style={{ paddingBottom: 'var(--safe-bottom)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-2.5 pb-1 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
              aria-hidden
            >
              <div className="h-1 w-10 rounded-full bg-[var(--color-on-surface-faint)]/40" />
            </div>

            {(title || trailing || !hideCloseButton) && (
              <div className="flex shrink-0 items-center gap-3 px-5 pt-1 pb-3">
                <div
                  id={typeof title === 'string' ? titleId : undefined}
                  className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight"
                >
                  {title}
                </div>
                {trailing}
                {!hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-dim)] text-[var(--color-on-surface-muted)] transition-colors hover:text-[var(--color-on-surface)]"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
