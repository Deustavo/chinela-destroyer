import pt from './pt'
import en from './en'

export type Lang = 'pt' | 'en'

const LOCALES: Record<Lang, Record<string, string>> = { pt, en }
const STORAGE_KEY = 'lang'

let current: Lang = (localStorage.getItem(STORAGE_KEY) as Lang | null) ?? 'pt'

export function getLang(): Lang {
  return current
}

export function setLang(lang: Lang): void {
  current = lang
  localStorage.setItem(STORAGE_KEY, lang)
}

export function t(key: string, ...args: (string | number)[]): string {
  const template = LOCALES[current][key] ?? key
  if (args.length === 0) return template
  return template.replace(/\{(\d+)\}/g, (_, i) => String(args[+i] ?? ''))
}
