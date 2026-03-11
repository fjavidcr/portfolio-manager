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

// Cache Intl.DateTimeFormat for faster date formatting
const esESDateFormatter = new Intl.DateTimeFormat('es-ES')
const defaultDateFormatter = new Intl.DateTimeFormat(undefined)
const shortMonthFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' })

export const formatDefaultDate = (date: Date) => {
  return defaultDateFormatter.format(date)
}

export const formatShortMonth = (date: Date) => {
  return shortMonthFormatter.format(date)
}

export const formatDate = (date: Date | Timestamp | { seconds: number } | null | undefined) => {
  if (!date) return '-'

  let jsDate: Date
  // Handle Firestore Timestamp
  if (typeof date === 'object' && 'seconds' in date) {
    jsDate = new Date(date.seconds * 1000)
  } else {
    // Handle Date object or string
    jsDate = new Date(date as string | number | Date)
  }

  if (isNaN(jsDate.getTime())) return '-'
  return esESDateFormatter.format(jsDate)
}
