import type { Timestamp } from 'firebase/firestore'

// Cache Intl object for ~100x faster currency formatting in loops and reactive contexts
const defaultCurrencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: true
})

const cleanCurrencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: true,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) => {
  if (options) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      useGrouping: true,
      ...options
    }).format(value)
  }
  return defaultCurrencyFormatter.format(value)
}

export const formatCurrencyClean = (value: number) => {
  return cleanCurrencyFormatter.format(value)
}

// Cache Intl.DateTimeFormat objects for ~100x faster date formatting in loops
const defaultDateFormatter = new Intl.DateTimeFormat('es-ES')
const shortMonthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' })
const monthYearFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })

export const formatDate = (date: Date | Timestamp | { seconds: number } | null | undefined) => {
  if (!date) return '-'

  let d: Date
  if ('seconds' in date) {
    d = new Date(date.seconds * 1000)
  } else {
    d = new Date(date as Date)
  }

  if (isNaN(d.getTime())) return '-'
  return defaultDateFormatter.format(d)
}

export const formatShortMonth = (
  date: Date | Timestamp | { seconds: number } | null | undefined
) => {
  if (!date) return '-'

  let d: Date
  if ('seconds' in date) {
    d = new Date(date.seconds * 1000)
  } else {
    d = new Date(date as Date)
  }

  if (isNaN(d.getTime())) return '-'
  return shortMonthFormatter.format(d)
}

export const isValidDocId = (id: string): boolean => {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id)
}

export const formatMonthYear = (
  date: Date | Timestamp | { seconds: number } | null | undefined
) => {
  if (!date) return '-'

  let d: Date
  if ('seconds' in date) {
    d = new Date(date.seconds * 1000)
  } else {
    d = new Date(date as Date)
  }

  if (isNaN(d.getTime())) return '-'
  return monthYearFormatter.format(d)
}
