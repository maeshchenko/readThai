// Lesson data + Thai character data
const LESSONS = [
  { id: 1, day: "День 1", title: "Система классов", tag: "Согласные · LC1", tracks: 4, items: 13, progress: 1.0, kicker: "Низкий класс, группа 1", deck: "Каждая буква имеет класс — и от него зависит тон. Сегодня знакомимся с первой группой и семью долгими гласными." },
  { id: 2, day: "День 2", title: "Вопрос жизни и смерти", tag: "Финальные согласные", tracks: 7, items: 18, progress: 0.55, kicker: "Живые vs. мёртвые слоги" },
  { id: 3, day: "День 3", title: "Короткая‑прекороткая история", tag: "Краткие гласные", tracks: 6, items: 14, progress: 0.20 },
  { id: 4, day: "День 4", title: "Молчаливый партнёр", tag: "Кластеры с อ", tracks: 8, items: 16, progress: 0.0 },
  { id: 5, day: "День 5", title: "Теория тонов", tag: "5 тонов", tracks: 8, items: 22, progress: 0.40 },
  { id: 99, day: "Антракт", title: "Антракт", tag: "Передышка", tracks: 5, items: 0, progress: 0.0, special: true },
  { id: 6, day: "День 6", title: "Запомни мои слова", tag: "Высокий класс", tracks: 7, items: 17, progress: 0.0 },
  { id: 7, day: "День 7", title: "Разбираемся с кластерами", tag: "Двойные начала", tracks: 8, items: 20, progress: 0.0 },
  { id: 8, day: "День 8", title: "Услышь меня, рор!", tag: "Особые согласные", tracks: 10, items: 24, progress: 0.0 },
  { id: 9, day: "День 9", title: "Исключения из правил", tag: "Тон‑маркеры", tracks: 7, items: 19, progress: 0.0 },
  { id: 100, day: "Подготовка", title: "Подготовка", tag: "Перед финалом", tracks: 2, items: 0, progress: 0.0, special: true },
  { id: 10, day: "День 10", title: "Последний день: Начало", tag: "Чтение текста", tracks: 4, items: 12, progress: 0.0 },
];

const PROLOGUE = [
  { id: "preface", label: "Предисловие" },
  { id: "intro", label: "Введение" },
  { id: "guide", label: "Гид по произношению" },
];

const APPENDIX = [
  { id: "app1", label: "Сводка тайских символов" },
  { id: "app2", label: "Названия согласных" },
  { id: "app3", label: "Словарный путь" },
  { id: "app4", label: "Слова с ฤ" },
];

// Day 1 chars — Low Class consonants group 1 + long vowels
const LC1 = [
  { glyph: "น", ipa: "n",  name: "nor", ru: "н", initial: "n", final: "-n" },
  { glyph: "ม", ipa: "m",  name: "mor", ru: "м", initial: "m", final: "-m" },
  { glyph: "ง", ipa: "ŋ",  name: "ngor", ru: "нг (носовое)", initial: "ng", final: "-ng" },
  { glyph: "ร", ipa: "r",  name: "ror", ru: "р (раскатистое)", initial: "r", final: "-n" },
  { glyph: "ล", ipa: "l",  name: "lor", ru: "л", initial: "l", final: "-n" },
  { glyph: "ย", ipa: "j",  name: "yor", ru: "й", initial: "y", final: "-i" },
  { glyph: "ว", ipa: "w",  name: "wor", ru: "в / w", initial: "w", final: "-o" },
];

const LONG_VOWELS = [
  { glyph: "–า", ipa: "aː", name: "aa", ru: "долгое а" },
  { glyph: "–ี", ipa: "iː", name: "ee", ru: "долгое и" },
  { glyph: "–ู", ipa: "uː", name: "oo", ru: "долгое у" },
  { glyph: "เ–", ipa: "eː", name: "ay", ru: "долгое э" },
  { glyph: "แ–", ipa: "ɛː", name: "air", ru: "долгое широкое э" },
  { glyph: "โ–", ipa: "oː", name: "oh", ru: "долгое о" },
];

// Day-1 syllable practice (try-it block)
const SYL_PRACTICE = [
  { glyph: "นา",  ipa: "naa",  ru: "поле" },
  { glyph: "มี",  ipa: "mee",  ru: "иметь" },
  { glyph: "เลน", ipa: "len*", ru: "—" },
  { glyph: "แรง", ipa: "rang*",ru: "сила" },
  { glyph: "โยง", ipa: "yong*",ru: "связывать" },
  { glyph: "วอ",  ipa: "waw",  ru: "—" },
  { glyph: "งู",  ipa: "nguu", ru: "змея" },
  { glyph: "ยีน", ipa: "yeen", ru: "ген" },
  { glyph: "เรม", ipa: "rem*", ru: "—" },
  { glyph: "งอม", ipa: "ngom*",ru: "перезрелый" },
];

// Multi-choice practice deck
const MC_BANK = [
  { glyph: "น", correct: "[n]", choices: ["[n]","[m]","[r]","[l]"] },
  { glyph: "ม", correct: "[m]", choices: ["[n]","[m]","[ŋ]","[w]"] },
  { glyph: "ง", correct: "[ŋ]", choices: ["[n]","[ŋ]","[k]","[g]"] },
  { glyph: "ย", correct: "[j]", choices: ["[i]","[j]","[y]","[r]"] },
  { glyph: "ว", correct: "[w]", choices: ["[w]","[v]","[u]","[ʋ]"] },
  { glyph: "ร", correct: "[r]", choices: ["[r]","[l]","[ɾ]","[ʁ]"] },
];

// Appendix sample — initial consonants by sound
const APP1_CONSONANTS = [
  { glyph: "พ ผ ภ", initial: "p", final: "-p" },
  { glyph: "ป",     initial: "bp", final: "" },
  { glyph: "บ",     initial: "b", final: "" },
  { glyph: "ฟ ฝ",   initial: "f", final: "" },
  { glyph: "ท ถ ธ ฒ ฑ ฐ", initial: "t", final: "-t" },
  { glyph: "ต ฏ",   initial: "dt", final: "" },
  { glyph: "ด ฎ",   initial: "d", final: "" },
  { glyph: "ซ ส ศ ษ", initial: "s", final: "" },
  { glyph: "ช ฉ ฌ", initial: "ch", final: "" },
  { glyph: "จ",     initial: "j", final: "" },
  { glyph: "ค ข ฆ", initial: "k", final: "-k" },
  { glyph: "ก",     initial: "g", final: "" },
  { glyph: "ม",     initial: "m", final: "-m" },
  { glyph: "น ณ",   initial: "n", final: "-n" },
  { glyph: "ร",     initial: "r", final: "-n" },
  { glyph: "ล ฬ",   initial: "l", final: "-n" },
  { glyph: "ง",     initial: "ng", final: "-ng" },
  { glyph: "ย",     initial: "y", final: "-i" },
  { glyph: "ว",     initial: "w", final: "-o" },
  { glyph: "ห ฮ",   initial: "h", final: "" },
  { glyph: "อ",     initial: "(silent)", final: "" },
];

window.LESSONS = LESSONS;
window.PROLOGUE = PROLOGUE;
window.APPENDIX = APPENDIX;
window.LC1 = LC1;
window.LONG_VOWELS = LONG_VOWELS;
window.SYL_PRACTICE = SYL_PRACTICE;
window.MC_BANK = MC_BANK;
window.APP1_CONSONANTS = APP1_CONSONANTS;
