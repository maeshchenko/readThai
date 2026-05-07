export interface ChapterMeta {
  id: string
  slug: string
  titleEn: string
  titleRu: string
  tracks: number[]
}

export const chapters: ChapterMeta[] = [
  { id: 'preface', slug: 'preface', titleEn: 'Preface', titleRu: 'Предисловие', tracks: [] },
  { id: 'introduction', slug: 'introduction', titleEn: 'Introduction', titleRu: 'Введение', tracks: [] },
  { id: 'pronunciation', slug: 'pronunciation', titleEn: 'Pronunciation Guide', titleRu: 'Гид по произношению', tracks: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 'day-1', slug: 'day-1', titleEn: 'Day 1: The Class System', titleRu: 'День 1: Система классов', tracks: [9, 10, 11, 12] },
  { id: 'day-2', slug: 'day-2', titleEn: 'Day 2: A Matter of Life and Death', titleRu: 'День 2: Вопрос жизни и смерти', tracks: [13, 14, 15, 16, 17, 18, 19] },
  { id: 'day-3', slug: 'day-3', titleEn: 'Day 3: A Short, Short Story', titleRu: 'День 3: Короткая-прекороткая история', tracks: [20, 21, 22, 23, 24, 25] },
  { id: 'day-4', slug: 'day-4', titleEn: 'Day 4: The Silent Partner', titleRu: 'День 4: Молчаливый партнёр', tracks: [26, 27, 28, 29, 30, 31, 32, 33] },
  { id: 'day-5', slug: 'day-5', titleEn: 'Day 5: Theory of Tones', titleRu: 'День 5: Теория тонов', tracks: [34, 35, 36, 37, 38, 39, 40, 41] },
  { id: 'intermission', slug: 'intermission', titleEn: 'Intermission', titleRu: 'Антракт', tracks: [42, 43, 44, 45, 46] },
  { id: 'day-6', slug: 'day-6', titleEn: 'Day 6: Mark My Words', titleRu: 'День 6: Запомни мои слова', tracks: [47, 48, 49, 50, 51, 52, 53] },
  { id: 'day-7', slug: 'day-7', titleEn: 'Day 7: Unclustering Your Life', titleRu: 'День 7: Разбираемся с кластерами', tracks: [54, 55, 56, 57, 58, 59, 60, 61] },
  { id: 'day-8', slug: 'day-8', titleEn: 'Day 8: Hear Me Ror!', titleRu: 'День 8: Услышь меня, Рор!', tracks: [62, 63, 64, 65, 66, 67, 68, 69, 70, 71] },
  { id: 'day-9', slug: 'day-9', titleEn: 'Day 9: The Outlaws', titleRu: 'День 9: Исключения из правил', tracks: [72, 73, 74, 75, 76, 77, 78] },
  { id: 'preliminary', slug: 'preliminary', titleEn: 'Preliminary', titleRu: 'Подготовка', tracks: [79, 80] },
  { id: 'last-day', slug: 'last-day', titleEn: 'Last Day: The Beginning', titleRu: 'Последний день: Начало', tracks: [81, 82, 83, 84] },
  { id: 'appendix-i', slug: 'appendix/i', titleEn: 'Appendix I: Thai Character Summary', titleRu: 'Приложение I: Сводка тайских символов', tracks: [] },
  { id: 'appendix-ii', slug: 'appendix/ii', titleEn: 'Appendix II: Consonant Names', titleRu: 'Приложение II: Названия согласных', tracks: [85] },
  { id: 'appendix-iii', slug: 'appendix/iii', titleEn: 'Appendix III: Dictionary Order', titleRu: 'Приложение III: Словарный порядок', tracks: [] },
  { id: 'appendix-iv', slug: 'appendix/iv', titleEn: 'Appendix IV: Words That Use ใ', titleRu: 'Приложение IV: Слова с ใ', tracks: [] },
  { id: 'appendix-v', slug: 'appendix/v', titleEn: 'Appendix V: Thai Fonts', titleRu: 'Приложение V: Тайские шрифты', tracks: [] },
  { id: 'glossary', slug: 'glossary', titleEn: 'Thai-English Glossary', titleRu: 'Тайско-английский глоссарий', tracks: [] },
]

export function getChapterBySlug(slug: string): ChapterMeta | undefined {
  return chapters.find((c) => c.slug === slug)
}

export function getAdjacentChapters(slug: string) {
  const idx = chapters.findIndex((c) => c.slug === slug)
  return {
    prev: idx > 0 ? chapters[idx - 1] : null,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : null,
  }
}
