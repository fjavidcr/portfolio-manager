import type { Timestamp } from 'firebase/firestore'

// Cache Intl formatters to avoid extremely expensive re-instantiation in reactive loops
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: true
})

const currencyCleanFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: true,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const dateFormatter = new Intl.DateTimeFormat('es-ES')

export const formatCurrency = (value: number, options?: Intl.NumberFormatOptions) => {
  if (options) {
    // If custom options are provided, we have to create a new formatter
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      useGrouping: true,
      ...options
    }).format(value)
  }
  return currencyFormatter.format(value)
}

export const formatCurrencyClean = (value: number) => {
  return currencyCleanFormatter.format(value)
}

export const formatDate = (date: Date | Timestamp | { seconds: number } | null | undefined) => {
  if (!date) return '-'
  // Handle Firestore Timestamp
  if ('seconds' in date) {
    return dateFormatter.format(new Date(date.seconds * 1000))
  }
  // Handle Date object or string
  return dateFormatter.format(new Date(date))
}
