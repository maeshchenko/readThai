export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; html: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'callout'; variant: 'tip' | 'warning' | 'note'; html: string }
  | { type: 'track'; number: number; label?: string }
  | { type: 'rule'; html: string; emphasis?: 'soft' | 'strong'; eyebrow?: string }
  | { type: 'examples'; layout?: ExamplesLayout; eyebrow?: string; items: ExampleItem[] }
  | { type: 'thaiExample'; thai: string; translit: string; meaning?: string; tone?: string }
  | { type: 'thaiTable'; columns: string[]; rows: ThaiTableRow[]; headerRows?: TableHeaderRow[]; stickyFirstCol?: boolean }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'exercise'; trackNumber?: number; instruction: string; items: string[]; answerKey?: string }
  | { type: 'recap'; items: string[] }
  | { type: 'divider' }
  | { type: 'footnoteRef'; id: number }

export type ExamplesLayout = 'chips' | 'grid' | 'inline'

export interface ExampleItem {
  thai: string
  translit?: string
  meaning?: string
  tone?: string
  note?: string
}

export interface ThaiTableRow {
  thai: string
  translit: string
  meaning?: string
}

export interface TableHeaderCell {
  text: string
  colSpan?: number
  align?: 'left' | 'center' | 'right'
}

export type TableHeaderRow = TableHeaderCell[]

export interface Chapter {
  id: string
  slug: string
  titleEn: string
  titleRu: string
  number?: number
  blocks: Block[]
  footnotes: Record<number, string>
  prev?: string
  next?: string
  _generated?: boolean
  _curated?: boolean
}
