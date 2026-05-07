import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor, Eye, EyeOff, Globe, Volume2, Trash2, Info } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useThemeStore, useThaiScriptStore, useProgressStore } from '@/lib/stores'
import { cn } from '@/lib/cn'
import { haptic } from '@/lib/haptic'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsSheet({ open, onClose }: Props) {
  const { i18n, t } = useTranslation()
  const lang = i18n.language as 'en' | 'ru'
  const { theme, setTheme } = useThemeStore()
  const { primary, showBoth, setPrimary, setShowBoth } = useThaiScriptStore()
  const { listenedTracks } = useProgressStore()

  const switchLang = (next: 'en' | 'ru') => {
    haptic('selection')
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <BottomSheet open={open} onClose={onClose} size="auto" title={lang === 'ru' ? 'Настройки' : 'Settings'} ariaLabel="Settings">
      <div className="space-y-6">
        <Group label={lang === 'ru' ? 'Внешний вид' : 'Appearance'}>
          <Row label={lang === 'ru' ? 'Тема' : 'Theme'}>
            <Segmented
              value={theme}
              onChange={(v) => {
                haptic('selection')
                setTheme(v as 'light' | 'dark' | 'system')
              }}
              options={[
                { value: 'light', icon: Sun, label: t('theme.light') },
                { value: 'dark', icon: Moon, label: t('theme.dark') },
                { value: 'system', icon: Monitor, label: t('theme.system') },
              ]}
            />
          </Row>
          <Row label={lang === 'ru' ? 'Язык интерфейса' : 'Language'} icon={Globe}>
            <Segmented
              value={lang}
              onChange={(v) => switchLang(v as 'en' | 'ru')}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'ru', label: 'RU' },
              ]}
            />
          </Row>
        </Group>

        <Group label={lang === 'ru' ? 'Тайский шрифт' : 'Thai script'}>
          <Row label={lang === 'ru' ? 'Стиль' : 'Style'}>
            <Segmented
              value={primary}
              onChange={(v) => {
                haptic('selection')
                setPrimary(v as 'looped' | 'loopless')
              }}
              options={[
                { value: 'looped', label: 'น', labelClassName: 'thai-looped' },
                { value: 'loopless', label: 'น', labelClassName: 'thai-loopless' },
              ]}
            />
          </Row>
          <Row
            label={lang === 'ru' ? 'Показать оба стиля' : 'Show both styles'}
            description={t('thaiScript.showBoth')}
          >
            <Toggle checked={showBoth} onChange={(v) => { haptic('selection'); setShowBoth(v) }} icon={showBoth ? Eye : EyeOff} />
          </Row>
        </Group>

        <Group label={lang === 'ru' ? 'Аудио' : 'Audio'}>
          <Row label={lang === 'ru' ? 'Скорость по умолчанию' : 'Default speed'} icon={Volume2}>
            <span className="text-sm tabular-nums text-[var(--color-on-surface-muted)]">1.0×</span>
          </Row>
        </Group>

        <Group label={lang === 'ru' ? 'Хранилище' : 'Storage'}>
          <Row label={lang === 'ru' ? 'Прослушано треков' : 'Tracks listened'}>
            <span className="text-sm tabular-nums text-[var(--color-on-surface-muted)]">{listenedTracks.size}</span>
          </Row>
          <button
            onClick={() => {
              if (confirm(lang === 'ru' ? 'Сбросить весь прогресс?' : 'Reset all progress?')) {
                localStorage.removeItem('progress')
                window.location.reload()
              }
            }}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
          >
            <span className="flex items-center gap-2.5">
              <Trash2 size={16} />
              {lang === 'ru' ? 'Сбросить прогресс' : 'Reset progress'}
            </span>
          </button>
        </Group>

        <Group label={lang === 'ru' ? 'О приложении' : 'About'}>
          <Row label={lang === 'ru' ? 'Версия' : 'Version'} icon={Info}>
            <span className="text-sm tabular-nums text-[var(--color-on-surface-muted)]">1.0.0</span>
          </Row>
        </Group>

        <p className="pt-2 text-center text-[11px] text-[var(--color-on-surface-faint)]">
          Read Thai · {lang === 'ru' ? 'сделано с любовью' : 'made with care'}
        </p>
      </div>
    </BottomSheet>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="eyebrow mb-2 px-2">{label}</div>
      <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-dim)] ring-1 ring-[var(--color-hairline)]">
        {children}
      </div>
    </section>
  )
}

function Row({
  label,
  description,
  icon: Icon,
  children,
}: {
  label: string
  description?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-hairline)] px-4 py-3 last:border-0">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {Icon && <Icon size={16} className="shrink-0 text-[var(--color-on-surface-muted)]" />}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{label}</div>
          {description && <div className="truncate text-[11px] text-[var(--color-on-surface-muted)]">{description}</div>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

interface SegmentedOption {
  value: string
  label: string
  labelClassName?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: SegmentedOption[]
}) {
  return (
    <div className="inline-flex rounded-lg bg-[var(--color-surface-bright)] p-0.5 ring-1 ring-[var(--color-hairline)]">
      {options.map((opt) => {
        const active = value === opt.value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex min-w-[36px] items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
              active
                ? 'bg-[var(--color-primary-600)] text-white shadow-sm'
                : 'text-[var(--color-on-surface-muted)] hover:text-[var(--color-on-surface)]',
            )}
            aria-pressed={active}
          >
            {Icon && <Icon size={13} />}
            <span className={opt.labelClassName}>{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ checked, onChange, icon: Icon }: { checked: boolean; onChange: (v: boolean) => void; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn(
        'relative h-7 w-12 rounded-full transition-colors duration-200',
        checked ? 'bg-[var(--color-primary-600)]' : 'bg-[var(--color-on-surface-faint)]/30',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--color-on-surface-muted)] shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      >
        {Icon && <Icon size={11} />}
      </span>
    </button>
  )
}
