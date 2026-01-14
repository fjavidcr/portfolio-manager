export const formatCurrency = (value: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    useGrouping: true
  }).format(value)
}

export const formatDate = (date: any) => {
  if (!date) return '-'
  // Handle Firestore Timestamp
  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString('es-ES')
  }
  // Handle Date object or string
  return new Date(date).toLocaleDateString('es-ES')
}
