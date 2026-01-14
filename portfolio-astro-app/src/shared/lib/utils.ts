import type { Timestamp } from 'firebase/firestore'

export const formatCurrency = (value: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    useGrouping: true
  }).format(value)
}

export const formatDate = (date: Date | Timestamp | { seconds: number } | null | undefined) => {
  if (!date) return '-'
  // Handle Firestore Timestamp
  if ('seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleDateString('es-ES')
  }
  // Handle Date object or string
  return new Date(date).toLocaleDateString('es-ES')
}
