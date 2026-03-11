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

// Cache Intl.DateTimeFormat objects for performance
const esDateFormatter = new Intl.DateTimeFormat('es-ES')
const systemDateFormatter = new Intl.DateTimeFormat('default')
const shortMonthFormatter = new Intl.DateTimeFormat('default', { month: 'short' })

export const formatSystemDate = (date: Date | null | undefined) => {
  if (!date) return ''
  return systemDateFormatter.format(date)
}

export const formatShortMonth = (date: Date | null | undefined) => {
  if (!date) return ''
  return shortMonthFormatter.format(date)
}

export const formatDate = (date: Date | Timestamp | { seconds: number } | null | undefined) => {
  if (!date) return '-'
  // Handle Firestore Timestamp
  if ('seconds' in date) {
    return esDateFormatter.format(new Date(date.seconds * 1000))
  }
  // Handle Date object or string
  return esDateFormatter.format(new Date(date))
}
