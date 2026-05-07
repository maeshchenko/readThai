import { cn } from '@/lib/cn'

interface Props {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

const ROUND_CLS = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-2xl',
  full: 'rounded-full',
}

export function Skeleton({ className, width, height, rounded = 'md' }: Props) {
  return (
    <div
      className={cn('skeleton', ROUND_CLS[rounded], className)}
      style={{ width, height }}
      aria-hidden
    />
  )
}

export function ChapterSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading chapter">
      <Skeleton height={36} width="72%" />
      <div className="flex flex-wrap gap-2">
        <Skeleton height={28} width={92} rounded="full" />
        <Skeleton height={28} width={64} rounded="full" />
        <Skeleton height={28} width={108} rounded="full" />
      </div>
      <div className="space-y-3">
        <Skeleton height={14} width="96%" />
        <Skeleton height={14} width="91%" />
        <Skeleton height={14} width="78%" />
        <Skeleton height={14} width="64%" />
      </div>
      <Skeleton height={84} rounded="lg" />
      <div className="space-y-3">
        <Skeleton height={14} width="88%" />
        <Skeleton height={14} width="93%" />
        <Skeleton height={14} width="71%" />
      </div>
      <Skeleton height={84} rounded="lg" />
    </div>
  )
}
