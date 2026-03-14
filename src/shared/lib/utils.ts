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

// ⚡ Bolt: Cache Intl object for ~100x faster date formatting in loops and reactive contexts
const esDateFormatter = new Intl.DateTimeFormat('es-ES')
export const defaultDateFormatter = new Intl.DateTimeFormat(undefined)

export const formatDate = (date: Date | Timestamp | { seconds: number } | null | undefined) => {
  if (!date) return '-'
  // Handle Firestore Timestamp
  if ('seconds' in date) {
    const d = new Date(date.seconds * 1000)
    return isNaN(d.getTime()) ? 'Invalid Date' : esDateFormatter.format(d)
  }
  // Handle Date object or string
  const d = new Date(date)
  return isNaN(d.getTime()) ? 'Invalid Date' : esDateFormatter.format(d)
}
