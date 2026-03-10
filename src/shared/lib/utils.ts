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
const shortMonthFormatter = new Intl.DateTimeFormat('default', { month: 'short' })

export const formatDate = (date: Date | Timestamp | { seconds: number } | null | undefined) => {
  if (!date) return '-'
  // Handle Firestore Timestamp
  if ('seconds' in date) {
    return defaultDateFormatter.format(new Date(date.seconds * 1000))
  }
  // Handle Date object or string
  return defaultDateFormatter.format(new Date(date))
}

export const formatShortMonth = (
  date: Date | Timestamp | { seconds: number } | null | undefined
) => {
  if (!date) return '-'
  if ('seconds' in date) {
    return shortMonthFormatter.format(new Date(date.seconds * 1000))
  }
  return shortMonthFormatter.format(new Date(date))
}
