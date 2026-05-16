import { useThemeStore } from '@/lib/stores'
import { Icon } from '@/components/ui/Icon'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  return (
    <div className="seg">
      <button
        type="button"
        className={`icon-btn ${theme === 'light' ? 'active' : ''}`}
        onClick={() => setTheme('light')}
        title="Светлая"
        aria-label="Light theme"
      >
        <Icon name="sun" />
      </button>
      <button
        type="button"
        className={`icon-btn ${theme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
        title="Тёмная"
        aria-label="Dark theme"
      >
        <Icon name="moon" />
      </button>
    </div>
  )
}
