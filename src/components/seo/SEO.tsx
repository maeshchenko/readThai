import { Helmet } from 'react-helmet-async'

interface Props {
  title: string
  description: string
  path: string
  ogImage: string
  locale?: 'ru' | 'en'
  type?: 'website' | 'article'
  audio?: string
  publishedTime?: string
  modifiedTime?: string
}

const SITE_URL = (import.meta.env?.VITE_SITE_URL as string | undefined)
const FALLBACK_HOST = (typeof window !== 'undefined' && window.location.origin) || 'https://example.github.io'
const HOST = SITE_URL && SITE_URL.startsWith('http') ? SITE_URL.replace(/\/$/, '') : FALLBACK_HOST
const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'

function absoluteUrl(path: string): string {
  const root = HOST + BASE.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : '/' + path
  return root + p
}

export function SEO({ title, description, path, ogImage, locale = 'ru', type = 'website', audio, publishedTime, modifiedTime }: Props) {
  const url = absoluteUrl(path)
  const img = ogImage.startsWith('http') ? ogImage : absoluteUrl(ogImage)
  const ogLocale = locale === 'ru' ? 'ru_RU' : 'en_US'
  const altLocale = locale === 'ru' ? 'en_US' : 'ru_RU'
  return (
    <Helmet>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, nofollow, max-snippet:0, max-image-preview:none, max-video-preview:0" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Читай по-тайски за 10 дней" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:image:secure_url" content={img} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={altLocale} />
      {audio && <meta property="og:audio" content={audio} />}
      {audio && <meta property="og:audio:type" content="audio/mpeg" />}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      <meta name="twitter:image:alt" content={title} />
    </Helmet>
  )
}
