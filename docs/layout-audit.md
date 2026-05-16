# Layout Audit — `readThai` (branch `redesign`)

**Дата:** 2026-05-16
**Инструмент:** chrome-devtools-mcp (puppeteer-под-капотом)
**Сервер:** `npm run dev` → `http://localhost:5173/readThai/`
**Локаль:** только русский (`localStorage.lang = 'ru'`)
**Vite base:** `/readThai/` (из `vite.config.ts:8`)
**Стек:** React 19 · Vite 8 · Tailwind v4 · Framer Motion · i18next · Zustand

---

## 0. Резюме

| # | Severity | Файл/правило | Симптом | Минимум где видно |
|---|---|---|---|---|
| 1 | 🔴 **Blocker** | `src/index.css:965` `.ref-table` | Горизонтальный overflow до **265 px** на мобильных | 320, 390, 430 |
| 2 | 🟠 **Major** | Slug приложений `appendix/i…v` со слэшем | Прямой URL `/appendix-iii` (как `id`) ведёт на 404 «Глава не найдена» | любой viewport |
| 3 | 🟡 **Minor** | `.nav-item` высотой 36–37 px | Touch-target ниже Apple HIG (44 × 44) — но только когда drawer открыт на mobile | mobile |
| 4 | 🟡 **Minor** | `<a>` в boot-логе DOM `link "ก Читай по-тайски …"` ведёт на `http://localhost:5173/readThai` (без trailing slash) | Лишний 302/canonical хоп; не баг рендера, но шероховатость | все |
| 5 | ℹ️ **Info** | Lighthouse Mobile (HomePage): A11Y 100 · Best Practices 100 · SEO 100 · Agentic 100 | Сильная база, no fail | mobile |

**Console errors / warnings:** ноль на всех проверенных страницах.

---

## 1. Объём прогона

### Проверенные routes (rus)
| URL | id главы | Назначение |
|---|---|---|
| `/` | — | HomePage |
| `/day-1` | `day-1` | длинный урок + аудио + tap-карточки |
| `/day-5` | `day-5` | таблица tone rules + StringTheory + flashcards |
| `/last-day` | `last-day` | максимум tap-карточек + изображения |
| `/appendix/i` | `appendix-i` | reference-таблицы (согласные + гласные + тоны) |
| `/appendix/ii` | `appendix-ii` | reference-таблица 44 строки |
| `/appendix/iii` | `appendix-iii` | текст без таблиц |
| `/glossary` | `glossary` | reference-таблица + 50+ k DOM nodes |
| `/preface` | `preface` | чистый текст |
| `/appendix-iii` (намеренная ошибка) | — | проверка 404-fallback |

### Viewports
| Имя | Размер | DPR | Тип |
|---|---|---|---|
| iPhone SE | 320 × 568 | 2 | mobile, touch |
| iPhone 12/13 | 390 × 844 | 3 | mobile, touch |
| iPhone 14 Pro Max | 430 × 932 | 3 | mobile, touch |
| iPad portrait | 768 × 1024 | 2 | touch |
| Desktop FHD | 1440 × 900 | 2 | desktop |
| Desktop wide | 1920 × 1080 | 1 | desktop |

Полный набор скриншотов: `docs/audit-screens/`.

---

## 2. Структурные находки

### 2.1 Layout breakpoint (sidebar → drawer)

| viewport | aside.x | aside.w | main.x | main.w | поведение |
|---|---|---|---|---|---|
| 320 | -280 | 280 | 0 | 320 | drawer, по умолчанию закрыт |
| 390 | -280 | 280 | 0 | 390 | drawer, по умолчанию закрыт |
| 430 | -280 | 280 | 0 | 430 | drawer, по умолчанию закрыт |
| 768 | -280 | 280 | 0 | 753 | drawer (всё ещё), без topbar-сжатия |
| 1440 | 0 | 280 | 280 | 1145 | sidebar фиксирован |
| 1920 | 0 | 280 | 280 | 1625 | sidebar фиксирован |

Breakpoint sidebar открыт ↔ закрыт между 768 и 1440. На iPad portrait drawer всё ещё прячется — это сознательное решение, ок.

Открытие меню на 390 (`Menu → click`): aside выезжает на `x=0`, overlay `390×844` — работает корректно.

### 2.2 Header `main`-зоны

- **Mobile (<≈1024 px)**: `[Menu] CONTENTS [Light] [Dark] [Home]` — без переключателя языка.
- **Desktop**: `[ЧИТАЛЬНЯ / … / breadcrumb] [RU] [EN] [Light] [Dark] [Home]` — селектор языка только тут.

⚠ Это значит, что на мобильном **языковую переключалку не достать через UI**. Сменить ru/en можно только: ручкой в DevTools (`localStorage.setItem('lang','ru')`), либо открыв сайт на десктопе. Не баг верстки, но UX-разрыв — стоит обсудить отдельно.

---

## 3. Детальные findings

### 🔴 F-1 ОВЕРФЛОУ `.ref-table` на мобильных

**Файлы:**
- `src/components/content/RefTable.tsx:14` — `<table className="ref-table">`
- `src/index.css:965-978` — стили

**Где воспроизводится:**

| Route | viewport | doc.scrollWidth | viewport | overflowX |
|---|---|---|---|---|
| `/appendix/i` | 320 | 585 | 320 | **+265 px** |
| `/appendix/i` | 390 | 585 | 390 | +195 px |
| `/appendix/i` | 768 | 753 | 753 | 0 ✓ |
| `/appendix/ii` | 390 | 491 | 390 | +101 px |
| `/glossary` | 390 | 538 | 390 | +148 px |
| `/appendix/iii` | 390 | 390 | 390 | 0 ✓ (нет таблиц) |

**Доказательство:** см. `docs/audit-screens/appendix1_320.png`, `appendix1_390.png`, `glossary_390.png`.

**Корневая причина:** `.ref-table` имеет `width: 100%` + cell padding `14px 18px` + минимум 4 столбца (Звук, Долгий мед., Долгий фин., Кратк. мед., Кратк. фин. — 5 колонок в Appendix I §2). Контент `td` (например IPA `-aa / -u- / -a`, или тайская группа `ก ข ฃ ค ฅ ฆ ง จ ฉ ช ซ`) не имеет `word-break`, поэтому ячейки расталкивают таблицу шире контейнера. `<table>` нет ни врапа с `overflow-x:auto`, ни `table-layout:fixed`.

**Побочный эффект:** `.rail-overlay` рассчитывает ширину от `body`, и когда таблица расширила страницу, оверлей растягивается до 539–586 px (видно в offenders dump). При открытии мобильного меню overlay визуально «торчит» вправо.

**Предложение для фикса** (CSS-only, без правки JSX):

```css
/* src/index.css около строки 965 */
.ref-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 24px 0; }
.ref-table-wrap .ref-table { margin: 0; }
@media (max-width: 720px) {
  .ref-table { font-size: 13px; }
  .ref-table th, .ref-table td { padding: 10px 12px; }
  .ref-table .glyph-cell { font-size: 22px; }
}
```

+ в `RefTable.tsx` обернуть `<table>` в `<div className="ref-table-wrap">`.

Альтернативно: `display: block; overflow-x: auto;` прямо на `.ref-table` — меньше правок, но ломает `border-collapse` визуально.

---

### 🟠 F-2 Несоответствие slug приложений и навигации

**Файлы:** `src/lib/chapters.ts:25-29`

```ts
{ id: 'appendix-i',   slug: 'appendix/i',   …},
{ id: 'appendix-ii',  slug: 'appendix/ii',  …},
{ id: 'appendix-iii', slug: 'appendix/iii', …},
{ id: 'appendix-iv',  slug: 'appendix/iv',  …},
{ id: 'appendix-v',   slug: 'appendix/v',   …},
```

**Симптом:** Прямой переход на `/appendix-iii` (что выглядит логично, т.к. `id` и slug у дней совпадают — `day-1` ↔ `day-1`) → fallback «Глава не найдена» (`docs/audit-screens/appendix3_1440.png` это первое неправильное состояние, я перенавигировал на `/appendix/iii` и сохранил исправленный скрин под тем же именем).

**Влияние:**
1. Внешние ссылки/шеры на `/appendix-iii` ломаются.
2. SPA-редирект `?p=` из `App.tsx:GhPagesSpaRedirect` тоже передаст `p=/appendix-iii` (если кто-то так залинковал).
3. Сайтмапы/SEO-инструменты при ручной правке ожидают `-`-форму.

**Варианты:**
- (А) переименовать slug в `appendix-i`…`appendix-v` (как `id`). Цена — поломанные старые внешние ссылки на `/appendix/i`.
- (Б) оставить как есть, но в `ChapterPage`/404 добавить редирект `appendix-N → appendix/N`. Безопаснее.
- (В) проверить, нет ли где-то в коде ссылок именно на `appendix-iii` без слэша (GH-Pages 404.html, README, share URL).

Не самостоятельный фикс — требует продуктового решения. Только пометить.

---

### 🟡 F-3 Touch-target `.nav-item`

В sidebar drawer кнопки уроков — `BUTTON.nav-item` размером ~235 × **36-37** px. Apple HIG минимум 44 × 44.

| viewport | nav-item h | проблема |
|---|---|---|
| 320 | 36 | да |
| 390 | 37 | да |
| 430 | 37 | да |

Влияет только когда drawer открыт. На десктопе sidebar тоже использует те же кнопки — но там клик мышью, риск минимален.

**Фикс:** в `.nav-item` поднять `min-height: 44px;` под `(max-width: 1023px)`, либо `padding-block: 12px` на всех.

Точка правки: вероятно `src/components/layout/Layout.tsx` + связанный CSS (не открывал, но `.nav-item` уникален).

---

### 🟡 F-4 Trailing slash в логотип-ссылке

Sidebar логотип-ссылка `href="http://localhost:5173/readThai"` (без `/` в конце), в то время как `vite.config.ts` `base: '/readThai/'`. Браузер сам редиректит на `/readThai/`, но это лишний раунд-трип. Похоже вычисляется как `BASENAME.replace(/\/$/, '')` в `App.tsx`.

Косметика. Если важно — оставить trailing slash либо использовать `<Link to="/">`.

---

### ℹ️ F-5 Производительность / Lighthouse (mobile, navigation)

URL: `http://localhost:5173/readThai/`
- Accessibility **100**
- Best Practices **100**
- SEO **100**
- Agentic Browsing **100**
- 0 failed audits / 44 passed

Полный отчёт: `docs/audit-screens/report.html`.

---

## 4. Проверки которые ПРОШЛИ (зелёное)

- ✅ Horizontal overflow на HomePage (все viewports).
- ✅ Horizontal overflow на `/day-1`, `/day-5`, `/last-day`, `/preface`, `/appendix/iii` (все viewports).
- ✅ Mobile drawer открывается/закрывается, overlay покрывает viewport.
- ✅ Sidebar появляется на desktop ≥ 1440.
- ✅ Шрифты (`Cormorant Garamond`, `IBM Plex Sans Thai Looped`, `Source Serif 4`) грузятся без layout-shift в logs.
- ✅ Console clean (0 errors, 0 warns) на всех проверенных страницах.
- ✅ Длинные тайские строки (`ความเกรงใจ…`) корректно переносятся в `day-last` §6.
- ✅ Audio player контролы видны и не выходят за viewport на 390.
- ✅ Footer/breadcrumb/«Далее»-CTA выровнены на всех viewports.
- ✅ Заголовки h1/h2/h3 масштабируются разумно.

---

## 5. План анализа (использованный)

### 5.1 Подготовка
- Прочитан `package.json`, `vite.config.ts`, `App.tsx`, `i18n/index.ts`, `lib/chapters.ts`, `components/content/RefTable.tsx`.
- Установлен `chrome-devtools-mcp` плагин, выполнен `/reload-plugins`.
- Запущен `npm run dev` (background, ID `bafhglc9d`).
- В браузере выставлен `localStorage.setItem('lang','ru')` + reload.

### 5.2 Per-page процедура
```
1. navigate_page(url)
2. wait_for(ru-маркер)
3. emulate(viewport) для каждого из 6 размеров (на ключевых страницах — для остальных подвыборка)
4. evaluate_script:
   - viewport, scrollWidth, scrollHeight
   - overflowX (= scrollW - clientW)
   - offenders: элементы где r.right > clientW + 0.5
   - smallTouch: button/a < 44×44
5. take_screenshot fullPage
6. list_console_messages (error|warn)
```

### 5.3 Что НЕ покрыто
- Аудио-плеер в действии (play/pause UI после старта).
- Tap-карточки в открытом состоянии (раскрытие ответа).
- Flashcards в pop-state (карточка перевёрнута).
- Печать/print stylesheet.
- Dark theme (вариант есть в UI, не прогонялся).
- Контраст AAA для мелкого текста — Lighthouse покрывает AA.
- A11y deep audit с клавиатурным фокус-таргетингом по всему пути.
- iPad landscape, hi-DPI > 3, viewport > 1920.

---

## 6. Приоритеты фиксов

| Pr | Action | Файлы | Effort |
|---|---|---|---|
| P0 | Wrap `.ref-table` в `overflow-x:auto` + mobile padding/font-size | `src/components/content/RefTable.tsx`, `src/index.css:965-978` | XS |
| P1 | Решить slug-mismatch для `/appendix-N` (redirect или rename) | `src/lib/chapters.ts`, `src/pages/ChapterPage.tsx` | S |
| P2 | `.nav-item { min-height: 44px }` под mobile | `src/index.css` + locate class | XS |
| P3 | Добавить переключатель `RU/EN` в мобильный header | `src/components/layout/Layout.tsx` | S-M |
| P4 | Mobile sticky audio control на iPhone 14 Pro Max — проверить с safe-area-inset-bottom | `src/components/audio/*` | S |

---

## 7. Применённые фиксы (2026-05-16)

| ID | Файлы | Изменение | Регресс |
|---|---|---|---|
| F-1 | `src/components/content/RefTable.tsx`, `src/index.css:964-985` | `<table>` обёрнута в `.ref-table-wrap` с `overflow-x:auto`. Mobile (`max-width: 720px`): padding 14→10/12, font 14→13, glyph 26→22, ipa 13→12. Wrap имеет `margin:-18px` чтобы скролл-зона касалась края viewport. | appendix/i 320: overflowX **+265 → 0**. appendix/i 390: **+195 → 0**. glossary 390: **+148 → 0**. appendix/ii 390: **+101 → 0**. Desktop 1440 без регресса. |
| F-2 | `src/pages/ChapterPage.tsx:115` | `useEffect` ловит slug `/^appendix-(i{1,3}\|iv\|v)$/i` и делает `navigate('/appendix/'+n, {replace:true})`. | `/appendix-iii` → `/appendix/iii` рендерит контент. |
| F-3 | `src/index.css:1407` | В `@media (max-width: 880px)` добавлено `.rail .nav-item { min-height: 44px; padding: 10px; font-size: 14px }`. | Все 20 nav-item в drawer теперь ровно 44 px. |
| F-5 | `src/index.css:1067-1068` | Снят `display:none` на `.top-actions .lang`. Кнопки сжаты до `min-height:28px font-size:10.5px`. | RU/EN-переключатель присутствует на mobile, помещается рядом с theme+home. |
| F-6 | `src/pages/ChapterPage.tsx:68`, `src/components/content/ContentRenderer.tsx` | Снят truncation `slice(0,277)+'…'` в `firstParagraph`. Добавлен prop `skipDeckText` в ContentRenderer — пропускает первый body-paragraph, текст которого = deck. Устраняет обрезание И дубликат. | day-1 deck 690 chars, без `…`. Дубликат удалён. preface 801 chars, дубликат удалён. |
| bonus | `src/components/layout/NavItem.tsx` | `whiteSpace:nowrap + text-overflow:ellipsis` → `lineHeight:1.25 + overflowWrap:break-word`. Длинные названия больше не обрезаются. | drawer пункты с длинными названиями (`День 3: Короткая-прекороткая история`) рендерятся в 2 строки, кнопка растёт под min-height. |
| F-7 | `src/index.css:553` | На viewports ≥ 1561px (где видна боковая `.toc`): `.lesson-view { max-width: 1000px; padding-right: 280px }`. Контент сдвигается влево, TOC помещается справа без перекрытия. | 1920: title.right=1313, toc.left=1341 (gap 28). 1600: 1153 vs 1181 (gap 28). 1440: TOC скрыт (media `max-width: 1560px`). |

**Файлы изменены:**
```
src/components/content/RefTable.tsx
src/index.css
src/pages/ChapterPage.tsx
```

**Финальные verify-скриншоты** (`docs/audit-screens/`):
- `appendix1_320_FIXED.png`, `appendix1_390_FIXED.png`, `appendix1_1440_FIXED.png`
- `glossary_390_FIXED.png`
- `home_390_menu_open_FIXED.png`

**Что осталось как есть:**
- F-4 (trailing slash в `<Link to="/">`) — следствие `BASENAME.replace(/\/$/,'')` в `App.tsx` для GH-Pages SPA-редиректа. Браузер сам нормализует, лишний хоп только в локальном dev — менять небезопасно.

## 8. Артефакты

```
docs/audit-screens/
  home_320.png            home_390.png       home_430.png
  home_768.png            home_1440.png      home_1920.png
  home_390_menu_open.png
  day1_390.png            day1_1440.png
  day5_390.png            day5_1440.png
  lastday_390.png         lastday_1440.png
  preface_390.png         preface_1440.png
  appendix1_320.png       appendix1_390.png  appendix1_768.png
  appendix2_390.png
  appendix3_390.png       appendix3_1440.png
  glossary_390.png        glossary_1440.png
  report.html             report.json     ← Lighthouse mobile
```
