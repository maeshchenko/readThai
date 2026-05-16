# План SEO-оптимизации readThai

**Дата:** 2026-05-16
**Цель:** сделать сайт находимым в поиске (Google/Yandex), красиво репостабельным (FB / Telegram / X / VK / WhatsApp / iMessage / LinkedIn / Slack), а контент — пригодным для индексации AI-агентами (ChatGPT browsing, Perplexity, Claude, etc.).

Текущее состояние: SPA на Vite, деплой GH Pages по адресу `https://<user>.github.io/readThai/`. В `index.html` есть `<title>`, короткий `description`, favicon, theme-color, manifest. **Отсутствует:** Open Graph, Twitter Card, canonical, hreflang, robots, structured data, sitemap, prerender, OG-картинка, AI-friendly mirror, per-route метаданные. Боты, скрейпящие сайт, получают пустой `<div id="root">` без контента.

---

## 0. Что меняется при загрузке без JS

Сейчас Google умеет рендерить JS, но:
- delay в индексации (вторая волна crawl)
- Yandex/Bing хуже
- Соцсети (Facebook, Telegram, Twitter) **никогда** не запускают JS — они читают только статический HTML. Без prerender share-карточки будут пустыми.
- AI-краулеры (GPTBot, ClaudeBot, PerplexityBot) обычно читают статический HTML; некоторые исполняют JS, но не все.

Поэтому **prerender (или SSG) — фундамент**, без которого остальные пункты дают только ~40% эффекта.

---

## 1. Архитектурное решение: статический prerender

### Вариант (выбран) — `vite-plugin-prerender-spa` или `vite-react-ssg`

Сборка `npm run build` запускает headless-Chromium, обходит список маршрутов, сохраняет финальный HTML для каждого в `dist/<slug>/index.html`. SPA остаётся, но первый запрос отдаёт уже отрендеренный контент.

Альтернативы:
- **`react-snap`** — простая, но без Vite 8 совместимости из коробки. Скип.
- **Полный SSG-переход на Next.js** — переписывание роутинга, overkill для текущего объёма. Скип.
- **Static gen-скрипт собственный** — `puppeteer` + `vite preview` + список slug-ов в `chapters.ts`. Контролируемо, минимум зависимостей. Рекомендую.

### Список URL для prerender (берётся из `src/lib/chapters.ts`)

```
/
/preface
/introduction
/pronunciation
/day-1 … /day-9
/intermission
/preliminary
/last-day
/appendix/i … /appendix/v
/glossary
```

= 21 страница. Для каждой генерируется свой `<title>`, `<meta description>`, OG-теги, JSON-LD, canonical.

### Что prerender НЕ делает

- Динамические state (recording, audio playback, theme toggle) остаются клиентскими — это норма.
- After hydration React берёт управление.

---

## 2. Базовая мета (per-page)

Реализация через **`react-helmet-async`** в каждом компоненте страницы. Helmet записывает в `<head>` через React, prerender фиксирует результат в HTML.

Альтернатива — генерация HTML вручную в скрипте prerender. Helmet + prerender — стандарт.

### 2.1 Глобальные теги (один раз, в `index.html` / `<Layout>`)

| Тег | Значение |
|---|---|
| `<html lang>` | динамически `ru` или `en` по i18n |
| `<title>` | per-page |
| `<meta name="description">` | per-page, 150-160 chars |
| `<meta name="keywords">` | не нужно (Google игнорирует, риск penalty при overstuffing) |
| `<link rel="canonical">` | per-page, абсолютный URL |
| `<link rel="alternate" hreflang="ru">` | альтернативная версия |
| `<link rel="alternate" hreflang="en">` | альтернативная версия |
| `<link rel="alternate" hreflang="x-default">` | дефолтная (англ.) |
| `<meta name="robots">` | `index, follow, max-image-preview:large` |
| `<meta name="author">` | автор книги |
| `<meta name="theme-color">` | уже есть, оставить |
| `<meta name="referrer">` | `strict-origin-when-cross-origin` (privacy) |

### 2.2 Per-route шаблоны

**HomePage** (`/`):
- title: `Читай по-тайски за 10 дней — учебник тайского письма`
- description: `Десять структурированных уроков, 85 нативных аудио и тренировка голоса. За две недели тайские буквы перестают быть каракулями.`

**ChapterPage** для дней:
- title: `День 1: Система классов — Читай по-тайски за 10 дней`
- description: первый абзац deck-а, обрезан до 155 chars
- canonical: `https://<host>/readThai/day-1`

Для приложений:
- title: `Приложение I: Сводка тайских символов — Читай по-тайски`

Для глоссария:
- title: `Тайско-русский глоссарий — 800+ слов`
- description: `Алфавитный словарь тайских слов с произношением и переводом. Часть курса «Читай по-тайски за 10 дней».`

Гид по произношению, предисловие, введение — аналогично.

---

## 3. Open Graph (Facebook, Telegram, VK, WhatsApp, LinkedIn, iMessage, Slack)

Каждая страница получает полный комплект:

```
<meta property="og:type" content="article" /> (или "book" для glossary, "website" для /)
<meta property="og:site_name" content="Читай по-тайски за 10 дней" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:url" content="https://.../day-1" />
<meta property="og:image" content="https://.../og/day-1.png" />
<meta property="og:image:secure_url" content="..." />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="День 1: Система классов" />
<meta property="og:locale" content="ru_RU" />
<meta property="og:locale:alternate" content="en_US" />

<!-- Article-only -->
<meta property="article:author" content="..." />
<meta property="article:section" content="Уроки" />
<meta property="article:published_time" content="2014-10-21T00:00:00Z" />
<meta property="article:modified_time" content="2026-05-16T00:00:00Z" />
<meta property="article:tag" content="тайский язык" />
<meta property="article:tag" content="thai script" />
```

### 3.1 OG-картинка (1200×630 PNG)

**Стратегия — 2 варианта одновременно:**

**A. Статический baseline** (`public/og/default.png`):
- 1200×630
- Фон `#f3ece0`
- Большая ก символом (тайская графика)
- Заголовок «Читай по-тайски за 10 дней» (Cormorant Garamond)
- Подзаголовок «Десять уроков · 85 аудио · тренировка голоса»
- Терракотовая точка-акцент
- Внизу URL/wordmark

Используется как fallback для главной + общих репостов.

**B. Per-chapter generated** (`public/og/<slug>.png`):
- Тот же шаблон + большой `День N` / название главы / эмодзи-метка («согласные · LC1», «пять тонов» итд)
- Генерируется build-time через `sharp` + SVG-шаблон (как `scripts/generate_icons.mjs`)
- Скрипт читает `chapters.ts` + per-chapter JSON, выводит 21 PNG в `public/og/`

Технически: SVG-шаблон с переменными `${title}, ${eyebrow}, ${minutes}, ${tracks}` → `sharp().resize(1200, 630).png()`.

### 3.2 Проверка превью

После деплоя проверить:
- Facebook Sharing Debugger: `https://developers.facebook.com/tools/debug/`
- Twitter Card Validator: `https://cards-dev.twitter.com/validator`
- LinkedIn Post Inspector: `https://www.linkedin.com/post-inspector/`
- Telegram: послать ссылку в @WebpageBot
- VK: вставить в новый пост в режиме черновика
- iMessage / WhatsApp / Slack: вручную

---

## 4. Twitter / X Card

```
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://.../og/day-1.png" />
<meta name="twitter:image:alt" content="День 1: Система классов" />
<meta name="twitter:site" content="@..." />  (если есть аккаунт)
<meta name="twitter:creator" content="@..." />
```

`summary_large_image` использует ту же 1200×630 что и OG (картинка обрезается до 2:1).

---

## 5. Structured Data (JSON-LD)

Google и Yandex используют для rich snippets. Также AI-агенты сильно опираются на JSON-LD при суммаризации.

### 5.1 На главной (`/`) — `Course`

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Читай по-тайски за 10 дней",
  "description": "...",
  "provider": { "@type": "Organization", "name": "Read Thai" },
  "inLanguage": "ru",
  "educationalLevel": "Beginner",
  "teaches": "Thai script reading",
  "timeRequired": "P10D",
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "Online",
    "courseWorkload": "PT5H",
    "instructor": { "@type": "Person", "name": "..." }
  },
  "isAccessibleForFree": true,
  "image": "https://.../og/default.png"
}
```

Параллельно — `Book` (это книга-учебник):

```json
{
  "@context": "https://schema.org",
  "@type": "Book",
  "name": "Read Thai in 10 Days",
  "alternateName": "Читай по-тайски за 10 дней",
  "bookEdition": "Second Edition",
  "datePublished": "2014-10-21",
  "inLanguage": ["en","ru"],
  "author": { "@type": "Person", "name": "..." },
  "numberOfPages": 200,
  "isbn": "...",  // если есть
  "image": "..."
}
```

### 5.2 На главах — `LearningResource` + `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": "День 1: Система классов",
  "description": "...",
  "inLanguage": "ru",
  "educationalLevel": "Beginner",
  "learningResourceType": "Lesson",
  "teaches": "Thai consonant classes, low class 1, long vowels",
  "timeRequired": "PT22M",
  "audio": [
    {"@type":"AudioObject","contentUrl":"https://.../audio/009.mp3"}
  ],
  "isPartOf": { "@type":"Course", "name":"Читай по-тайски за 10 дней" },
  "image": "https://.../og/day-1.png"
}
```

### 5.3 На glossary — `DefinedTermSet`

```json
{
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "name": "Тайско-русский глоссарий",
  "hasDefinedTerm": [
    {
      "@type": "DefinedTerm",
      "name": "ก",
      "termCode": "/gor gài/",
      "description": "курица"
    }
  ]
}
```

(массив до 50-100 первых терминов — больше тратит memory; остальное скроется в expanded list)

### 5.4 BreadcrumbList на каждой главе

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type":"ListItem", "position":1, "name":"Главная", "item":"https://.../" },
    { "@type":"ListItem", "position":2, "name":"Уроки", "item":"https://.../" },
    { "@type":"ListItem", "position":3, "name":"День 1: Система классов" }
  ]
}
```

### 5.5 На главной — `WebSite` + `SearchAction`

Включает Google sitelinks search-box:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Читай по-тайски за 10 дней",
  "url": "https://.../",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://.../glossary?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

(если решим завести query-параметр поиска в glossary; иначе пропустить)

---

## 6. Sitemap + robots.txt

### `public/sitemap.xml` (генерится build-time из chapters.ts)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://.../readThai/</loc>
    <lastmod>2026-05-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ru" href="https://.../readThai/" />
    <xhtml:link rel="alternate" hreflang="en" href="https://.../readThai/?lang=en" />
  </url>
  <url>
    <loc>https://.../readThai/day-1</loc>
    <lastmod>2026-05-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  ...
</urlset>
```

Если поддержим `/en/<slug>` отдельные URL — sitemap включает обе версии с правильным `hreflang`.

### `public/robots.txt`

```
User-agent: *
Allow: /
Disallow: /readThai/dist.zip
Disallow: /readThai/test.html

# AI crawlers — разрешаем (нам нужна индексация AI)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: https://.../readThai/sitemap.xml
```

(если потом захочется блокировать AI — поменять на `Disallow: /`. Сейчас открываем, чтобы попадать в их ответы.)

---

## 7. AI-friendly особые файлы

### 7.1 `/llms.txt` (новый стандарт llmstxt.org, для AI-агентов)

Корневой markdown-индекс сайта для AI:

```markdown
# Читай по-тайски за 10 дней

> Бесплатный учебник тайского письма с аудио, упражнениями и тренировкой голоса. Десять структурированных уроков от классов согласных до полноценного чтения текста. Русская локализация книги «Read Thai in 10 Days, 2nd Edition».

## Уроки

- [Гид по произношению](https://.../pronunciation): IPA-обзор всех звуков
- [День 1: Система классов](https://.../day-1): согласные низкого класса LC1
- [День 2: Вопрос жизни и смерти](https://.../day-2): финальные согласные
- ...

## Справочник

- [Приложение I: Сводка тайских символов](https://.../appendix/i)
- [Тайско-русский глоссарий](https://.../glossary): 800+ слов

## Авторские заметки

- [Предисловие](https://.../preface)
- [Введение](https://.../introduction)
```

### 7.2 `/llms-full.txt`

Расширенная версия — конкатенация всех глав в plain markdown, с заголовками + текстом + транслитерациями. AI-агент получает полный контекст одним запросом. Генерится build-time.

### 7.3 Per-page markdown mirror (опционально, recommended)

Для каждого URL `/<slug>` — параллельный `/<slug>.md` (или через content-negotiation `Accept: text/markdown`). AI-краулер получает чистый markdown без HTML-оберток.

GH Pages не поддерживает content-negotiation, поэтому генерим отдельные `.md` файлы:

```
/day-1 → HTML страница для людей
/day-1.md → plain markdown для AI
```

Сам markdown — преобразование `chapter.blocks[]` в текст: heading → `##`, paragraph → текст, examples → таблица, callout → blockquote, recap → bullet list, track → пометка «[аудио NN]».

Linked from `<link rel="alternate" type="text/markdown" href="/day-1.md">` в `<head>`, чтобы AI-краулер заметил.

---

## 8. Hreflang + языковые версии

### 8.1 URL-стратегия

Сейчас язык — `localStorage.lang`. Это **невидимо для поисковика** — оба ru/en варианта живут под одним URL, что снижает ranking.

Варианты:
- **A. Query-параметр**: `/day-1` (ru, default) и `/day-1?lang=en` — простой, не требует роутинга, но Google хуже относится к query-варианту.
- **B. Path-префикс**: `/day-1` (ru) и `/en/day-1` — лучше для SEO, но требует роутинга.
- **C. Subdomain**: `ru.readThai...` / `en.readThai...` — overkill для GH Pages.

Рекомендую **B (path-префикс)** для en, с дефолтом без префикса на ru (это RU-первичный сайт):
- `/` → ru
- `/en/` → en
- `/day-1` → ru, `/en/day-1` → en

Изменения нужны в `App.tsx` router + i18n init + Layout breadcrumbs.

### 8.2 `<link rel="alternate">` на каждой странице

```html
<link rel="alternate" hreflang="ru" href="https://.../readThai/day-1" />
<link rel="alternate" hreflang="en" href="https://.../readThai/en/day-1" />
<link rel="alternate" hreflang="x-default" href="https://.../readThai/en/day-1" />
```

(x-default обычно ставится на интернациональную версию — англ.)

---

## 9. Производительность как SEO-фактор

Google Page Experience учитывает Core Web Vitals. Текущее состояние из Lighthouse mobile (предыдущий аудит):
- Accessibility 100, Best Practices 100, SEO 100, A11y 100.
- Performance не запускали — нужно сделать.

Что проверить и при необходимости поправить:

| Метрика | Цель | Текущее |
|---|---|---|
| LCP | < 2.5s | TBD — `npm run build && lighthouse mobile` |
| INP | < 200ms | TBD |
| CLS | < 0.1 | TBD (Cormorant Garamond может вызывать FOUT — проверить font-display) |

Конкретные точки:
- `@fontsource/cormorant-garamond` и др. — bundle size + critical font preload (`<link rel="preload" as="font">`)
- chapter JSON чанки — lazy load через `chapterLoader.ts` уже есть, но HomePage грузит ВСЕ через `chapters.ts` — оставить (только метаданные).
- Audio MP3 — lazy load по клику, не auto-preload в `<audio>`.
- Images в `public/images/` — добавить `loading="lazy"` (есть в `ContentRenderer.tsx`).
- WebP/AVIF альтернативы для крупных изображений (через `<picture>`).
- Sharp-генерация thumbnail-версий + responsive `srcset` (если останется время).

---

## 10. Дополнительные мета-улучшения

### 10.1 Favicon + иконки (уже сделано в предыдущей задаче)

- SVG favicon, apple-touch sizes 120/152/180.
- Manifest 192/512 + maskable.
- ✓ выполнено.

### 10.2 Web App Manifest расширения

Сейчас уже есть. Дополнить:
- `screenshots` — 1-3 PNG-скрина для PWA store (Android Chrome добавил «Install» с превью)
- `display_override: ["window-controls-overlay", "standalone"]` если решим в desktop PWA
- `share_target` — позволит делиться текстом В наше приложение (low priority)

### 10.3 RSS / Atom (опционально)

Если планируется добавлять новые главы / новости — `/feed.xml`. Сейчас контент статичный, можно пропустить.

### 10.4 Security headers (через GH Pages workflow или `_headers`)

GH Pages поддерживает custom headers через CNAME-only. Для full headers нужен Cloudflare proxy. Опционально:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy` (запрет камеры, кроме mic для VoiceTrainer)
- `Content-Security-Policy`

Низкий приоритет для SEO, но повышает Best Practices score.

### 10.5 Verification tags

Когда регистрируем сайт в:
- **Google Search Console** → `<meta name="google-site-verification">`
- **Yandex Webmaster** → `<meta name="yandex-verification">`
- **Bing Webmaster** → `<meta name="msvalidate.01">`
- **Pinterest** (если будет нужен) → `<meta name="p:domain_verify">`

Каждый добавляется в `<head>` после регистрации.

### 10.6 Analytics (опционально, отдельная задача)

GA4 / Plausible / Umami — для дальнейшей оптимизации, но не SEO напрямую.

---

## 11. План работ по фазам

### Phase 1 — фундамент (без него остальное не работает)
1. Поставить `react-helmet-async`.
2. Написать `<SEO>` компонент-обёртку: title, description, canonical, OG, Twitter, JSON-LD.
3. Подключить на HomePage + ChapterPage + 404.
4. Создать build-time скрипт prerender (`scripts/prerender.mjs`):
   - `vite build`
   - `vite preview` запускается background
   - `puppeteer` обходит список slug-ов
   - сохраняет HTML в `dist/<slug>/index.html`
5. Изменить `404.html` чтобы он редиректил на правильный slug (уже почти готово через `GhPagesSpaRedirect`).

### Phase 2 — социальные превью
6. Скрипт `scripts/generate_og.mjs` — SVG-шаблон + sharp → 21 PNG в `public/og/`.
7. Записать OG/Twitter теги через `<SEO>` компонент per route.
8. Прогнать через Facebook Debugger / Twitter Validator после деплоя.

### Phase 3 — structured data
9. Добавить JSON-LD в `<SEO>` для:
   - WebSite + Course + Book на `/`
   - LearningResource + BreadcrumbList на главах
   - DefinedTermSet на glossary
10. Проверить через `https://validator.schema.org/`

### Phase 4 — индексация + sitemap
11. `scripts/generate_sitemap.mjs` → `public/sitemap.xml`
12. `public/robots.txt` (вручную)
13. Зарегистрировать в Google Search Console, Yandex Webmaster, Bing
14. Отправить sitemap.

### Phase 5 — AI-friendly
15. `scripts/generate_llms_txt.mjs` → `/llms.txt` (короткий индекс) + `/llms-full.txt` (полный контент)
16. `scripts/generate_md_mirrors.mjs` → `dist/<slug>.md` (зеркала глав в plain markdown)
17. Linked from `<link rel="alternate" type="text/markdown">` в head

### Phase 6 — language routes (если решим вынести)
18. Path-префикс `/en/` через react-router
19. hreflang теги
20. i18n init по path (не localStorage)

### Phase 7 — performance polish
21. Lighthouse mobile run, фикс LCP/CLS если хуже 90.
22. Font preload + display:swap.
23. WebP версии крупных images.

### Phase 8 — verification + analytics (одноразово)
24. Регистрация в webmaster-консолях, вставка verification meta.
25. (опционально) GA4 / Plausible.

---

## 12. Файлы к созданию / правке

### Новые
```
src/components/seo/SEO.tsx           # Helmet-обёртка
src/components/seo/jsonld.ts         # JSON-LD конструкторы
scripts/prerender.mjs                # build-time prerender via puppeteer
scripts/generate_og.mjs              # 1200x630 PNG per slug
scripts/generate_sitemap.mjs         # sitemap.xml
scripts/generate_llms_txt.mjs        # llms.txt + llms-full.txt
scripts/generate_md_mirrors.mjs      # /<slug>.md per chapter
public/robots.txt                    # AI-allow + sitemap pointer
public/og/default.png                # fallback OG
public/og/<slug>.png × 21            # per-chapter OG
public/llms.txt                      # short index
public/llms-full.txt                 # full corpus
```

### Изменения
```
index.html                           # глобальные meta остаются, добавить ссылки на sitemap, llms-feed
package.json                         # scripts: og, sitemap, llms, prerender, postbuild
src/main.tsx                         # <HelmetProvider> wrapper
src/App.tsx                          # (опц.) language route
src/pages/HomePage.tsx               # <SEO ... />
src/pages/ChapterPage.tsx            # <SEO ... />
src/lib/chapters.ts                  # добавить description/keywords/datePublished per chapter (если хотим контролировать)
public/manifest.webmanifest          # screenshots field
public/404.html                      # уже редиректит ?p= — проверить совместимость с prerender
```

### Тесты после деплоя
- Facebook Sharing Debugger: 21 URL
- Twitter Validator: 21 URL
- LinkedIn Inspector: 5 ключевых URL
- Telegram @WebpageBot: 5 ключевых URL
- Google Rich Results Test: `https://search.google.com/test/rich-results` на /day-1, /glossary, /
- Schema.org Validator: те же
- Lighthouse Mobile SEO / Performance: главная + day-1 + glossary
- GTmetrix / WebPageTest: главная

---

## 12.5 Дополнения (после первого ревью)

### 12.5.1 404 страница — `noindex`

`public/404.html` уже есть (GH Pages SPA-fallback). Добавить в `<head>`:
```html
<meta name="robots" content="noindex, follow" />
<title>Страница не найдена — Читай по-тайски за 10 дней</title>
```
Не индексируется, но ссылки внутри живут.

### 12.5.2 `og:audio` для глав с треками

Telegram, FB, некоторые мессенджеры показывают inline аудио-плеер в превью если указан `og:audio`. Per-chapter, для каждого track-блока:

```html
<meta property="og:audio" content="https://.../audio/009.mp3" />
<meta property="og:audio:type" content="audio/mpeg" />
```

Один трек на главу (первый или «приоритетный») — иначе перегружено. Берётся из `chapter.tracks[0]` в `chapters.ts`.

### 12.5.3 `Organization` / `Person` JSON-LD на главной

Корневой «издатель» — структурный родитель для Course и Book. Один JSON-LD блок на главной:

```json
{
  "@context": "https://schema.org",
  "@type": "Person",     // или "Organization", в зависимости от ответа пользователя
  "name": "<author>",
  "url": "https://...",
  "sameAs": [
    "https://twitter.com/<handle>",
    "https://github.com/<handle>"
  ]
}
```

Сслылается на него из `Book.author`, `Course.provider`, `LearningResource.instructor`.

### 12.5.4 `.nojekyll` в `public/`

GH Pages по умолчанию прогоняет всё через Jekyll, который игнорирует файлы/папки с `_` префиксом и может ломать сборку. Пустой файл `public/.nojekyll` отключает Jekyll. Безопасно, обязательно для prerender со вложенными директориями типа `appendix/i/`.

### 12.5.5 Service Worker и SEO-инвалидация

`public/sw.js` уже есть. Service Worker кеширует HTML агрессивно — после деплоя пользователи с предыдущей версией могут не увидеть новых meta-тегов / OG-картинок.

Минимум:
- Bump cache version в `sw.js` (constant `CACHE_NAME = 'readThai-v2'`) на каждый SEO-деплой.
- В стратегии fetch для `index.html` использовать `network-first` (а не `cache-first`), чтобы свежий HTML с актуальной meta-разметкой всегда побеждал кеш при наличии сети.
- Опционально: на 1-2 деплоя сделать `sw.js` no-op (регистрация unregister) пока проверяем, что crawler'ы корректно подхватили новый HTML.

После проверки — вернуть кеширование.

### 12.5.6 Critical font preload

LCP-шрифт hero — Cormorant Garamond. Сейчас bundled через `@fontsource/cormorant-garamond` → попадает в CSS и грузится с задержкой. Чтобы ускорить LCP:

В `index.html` `<head>` добавить:
```html
<link rel="preload"
      as="font"
      type="font/woff2"
      crossorigin
      href="/readThai/assets/cormorant-garamond-500-latin.woff2" />
<link rel="preload"
      as="font"
      type="font/woff2"
      crossorigin
      href="/readThai/assets/cormorant-garamond-500-italic-latin.woff2" />
```

(точные имена файлов берутся из `dist/assets/` после билда — нужен build-time hook для подстановки hash'ей; либо использовать `<link rel="preload">` через JS из main.tsx).

Также убедиться, что @fontsource импорты используют `font-display: swap;` — это уже дефолт у @fontsource, но проверить через DevTools → Network.

Для IBM Plex Sans Thai Looped аналогично если он на главной (логотип ก).

### 12.5.7 `og:image:alt` контент

Не «logo». Должно описывать что на картинке для screen reader / accessibility. Шаблон:
```
og:image:alt = "Обложка главы: «День 1 — Система классов». Книжный учебник тайского письма."
```

### 12.5.8 Решения пользователя (зафиксировано)

| Параметр | Решение | Эффект на план |
|---|---|---|
| Домен | **отложен** — пока остаётся `<HOST>` плейсхолдер | Implementer при работе берёт реальный URL из git remote или ENV; код пишется с константой `import.meta.env.VITE_SITE_URL` или вычисляется из `window.location.origin`, чтобы можно было поменять без рефакторинга |
| Автор | **пропустить** | Убираем `Book.author`, `article:author`, `LearningResource.instructor`, корневой `Person` JSON-LD |
| Twitter/X handle | **нет** | Убираем `<meta name="twitter:site">`, `<meta name="twitter:creator">` (но `summary_large_image` и остальные twitter-теги остаются — они работают и без handle) |
| Аналитика | **нет** | Phase «analytics» удалена; никакого GA4/Plausible/Umami |
| Webmaster verification | через тот аккаунт, под которым будет регистрироваться сайт в GSC/Yandex — `<meta>` подставляется одноразово после регистрации | без изменений |

В итоге упрощения:
- `Course.provider`, `Course.instructor` — в schema можно опустить (оба `Person` опциональны при `Course`).
- `Book.author` опускаем.
- `Organization`/`Person` корневой JSON-LD убираем.
- В sitemap и canonical — placeholder `<HOST>`, заменяется одним sed-проходом перед билдом.

---

## 13. Что НЕ делаем (вне scope)

- Реальный backend / SSR.
- Динамическая генерация OG-картинок на лету (нужен Edge runtime — нет на GH Pages).
- AMP — устаревший стандарт.
- Структурные изменения текстов глав ради ключевых слов («keyword stuffing») — антипаттерн.
- Платная PWA, Apple App Store distribution.
- A/B-тесты заголовков.
- Покупка ссылок.
- Регистрация ISBN / отдельной публикации.

---

## 14. Метрики успеха

После деплоя + 2 недели:
- Google Search Console: индексировано ≥ 18 из 21 страницы
- Repost-test в Telegram/FB: превью с картинкой + заголовком + описанием на 100% страниц
- Lighthouse SEO: 100 (все pages)
- Lighthouse Performance Mobile: ≥ 90 на HomePage и ChapterPage
- AI-test: ChatGPT с включённым browsing по запросу «как читать тайский за 10 дней» возвращает ссылку на наш сайт ИЛИ цитирует контент (проверяется ручным запросом)
- Yandex Webmaster: проиндексировано ≥ 15 страниц
