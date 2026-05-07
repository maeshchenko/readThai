import { useThaiScriptStore } from '@/lib/stores'
import { cn } from '@/lib/cn'

interface Props {
  children: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: { primary: 'text-lg', secondary: 'text-base' },
  md: { primary: 'text-2xl', secondary: 'text-lg' },
  lg: { primary: 'text-3xl', secondary: 'text-xl' },
  xl: { primary: 'text-[2.5rem]', secondary: 'text-2xl' },
}

export function ThaiText({ children, size = 'md', className }: Props) {
  const { primary, showBoth } = useThaiScriptStore()
  const sizes = sizeClasses[size]

  const primaryFont = primary === 'looped' ? 'thai-looped' : 'thai-loopless'
  const secondaryFont = primary === 'looped' ? 'thai-loopless' : 'thai-looped'

  if (!showBoth) {
    return (
      <span className={cn(primaryFont, sizes.primary, 'leading-relaxed', className)}>
        {children}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex flex-col gap-0.5', className)}>
      <span className={cn(primaryFont, sizes.primary, 'leading-relaxed')}>
        {children}
      </span>
      <span className={cn(
        secondaryFont,
        sizes.secondary,
        'leading-relaxed text-[var(--color-on-surface-muted)]',
      )}>
        {children}
      </span>
    </span>
  )
}

export function ThaiTextInline({ children, className }: { children: string; className?: string }) {
  const { primary } = useThaiScriptStore()
  const font = primary === 'looped' ? 'thai-looped' : 'thai-loopless'
  return <span className={cn(font, 'leading-relaxed', className)}>{children}</span>
}
