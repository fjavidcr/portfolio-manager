export const formatCurrency = (value: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency,
        useGrouping: true,
    }).format(value);
};
