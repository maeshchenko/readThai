interface Props {
  src: string
  alt: string
  caption?: string
}

export function ImageBlock({ src, alt, caption }: Props) {
  const resolvedSrc = src.startsWith('http') ? src : `${import.meta.env.BASE_URL}${src}`

  return (
    <figure className="my-6">
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        className="mx-auto max-w-full rounded-lg border border-[var(--color-border)]"
      />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-[var(--color-on-surface-muted)]">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
