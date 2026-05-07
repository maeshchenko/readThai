export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string; textRu?: string }
  | { type: 'paragraph'; html: string; htmlRu?: string }
  | { type: 'list'; ordered: boolean; items: string[]; itemsRu?: string[] }
  | { type: 'callout'; variant: 'tip' | 'warning' | 'note'; html: string; htmlRu?: string }
  | { type: 'track'; number: number; label?: string }
  | { type: 'rule'; html: string; htmlRu?: string; emphasis?: 'soft' | 'strong'; eyebrow?: string }
  | { type: 'examples'; layout?: ExamplesLayout; eyebrow?: string; items: ExampleItem[] }
  | { type: 'thaiExample'; thai: string; translit: string; meaning?: string; meaningRu?: string; tone?: string }
  | { type: 'thaiTable'; columns: string[]; columnsRu?: string[]; rows: ThaiTableRow[]; headerRows?: TableHeaderRow[]; stickyFirstCol?: boolean }
  | { type: 'image'; src: string; alt: string; caption?: string; captionRu?: string }
  | { type: 'exercise'; trackNumber?: number; instruction: string; instructionRu?: string; items: string[]; itemsRu?: string[]; answerKey?: string; answerKeyRu?: string }
  | { type: 'recap'; items: string[]; itemsRu?: string[] }
  | { type: 'preview'; html: string; htmlRu?: string }
  | { type: 'divider' }
  | { type: 'footnoteRef'; id: number }

export type ExamplesLayout = 'chips' | 'grid' | 'inline'

export interface ExampleItem {
  thai: string
  translit?: string
  meaning?: string
  meaningRu?: string
  tone?: string
  note?: string
  noteRu?: string
}

export interface ThaiTableRow {
  thai: string
  translit: string
  translitRu?: string
  meaning?: string
  meaningRu?: string
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
  footnotesRu?: Record<number, string>
  prev?: string
  next?: string
  _generated?: boolean
  _curated?: boolean
}
