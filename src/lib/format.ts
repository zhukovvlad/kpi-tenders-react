export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—"
  if (bytes === 0) return "0 Б"
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDateShort(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

// «сегодня», «вчера», «3 дня назад», «2 недели назад» — короткие хронологические подписи
// для дашборда и списков. На десктопе ценнее текст, чем абсолютная дата.
const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatRelative(iso: string): string {
  const date = new Date(iso)
  if (isNaN(date.getTime())) return "—"
  const diff = Date.now() - date.getTime()
  if (diff < MINUTE) return "только что"
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} мин назад`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} ч назад`

  const days = Math.floor(diff / DAY)
  if (days === 0) return "сегодня"
  if (days === 1) return "вчера"
  if (days < 7) return `${days} дн назад`
  if (days < 31) return `${Math.floor(days / 7)} нед назад`
  if (days < 365) return `${Math.floor(days / 30)} мес назад`
  return `${Math.floor(days / 365)} г назад`
}

export function formatPercent(value: number | null | undefined, signed = true): string {
  if (value === null || value === undefined) return "—"
  const sign = signed && value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1).replace(".", ",")}%`
}
