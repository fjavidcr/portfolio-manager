import type { Timestamp } from 'firebase/firestore';

export interface AssetModel {
    id: string; // Ticker/symbol e.g. "AAPL"
    name: string;
    type: string; // 'Stock', 'Crypto', 'ETF', etc.
    currentValue: number;
    platformId: string;
    description?: string;
    lastUpdated?: Date | Timestamp;
    isArchived?: boolean;
}

export interface TransactionModel {
    id: string;
    userId: string;
    amount: number;
    description: string;
    assetId: string;
    date: Date | Timestamp;
    type: string; // 'Plan', 'Aportación', 'Retirada', 'Dividendo', 'Traspaso', 'Venta'
}

export const TransactionTypes = [
    'Plan',
    'Aportación',
    'Retirada',
    'Dividendo',
    'Traspaso',
    'Venta',
] as const;

export interface PlatformModel {
    id: string;
    name: string;
    iconUrl: string;
}
