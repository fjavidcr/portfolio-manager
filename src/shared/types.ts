import type { Timestamp } from 'firebase/firestore'

export interface AssetModel {
  id: string // Ticker/symbol e.g. "AAPL"
  name: string
  type: string // 'Stock', 'Crypto', 'ETF', etc.
  currentValue: number
  platformId: string
  description?: string
  lastUpdated?: Date | Timestamp
  isArchived?: boolean
}

export interface TransactionModel {
  id: string
  userId: string
  amount: number
  description: string
  assetId: string
  date: Date | Timestamp
  type: TransactionType
}

export const TransactionTypes = [
  'Plan',
  'Aportación',
  'Retirada',
  'Dividendo',
  'Traspaso',
  'Venta'
] as const

export type TransactionType = (typeof TransactionTypes)[number]

export const TransactionImpact = {
  Inflow: ['Plan', 'Aportación', 'Dividendo', 'Traspaso'],
  Outflow: ['Retirada', 'Venta']
} as const

export interface PlatformModel {
  id: string
  name: string
  iconUrl: string
}

export type BudgetFrequency = 'Monthly' | 'Annual'

export interface BudgetItem {
  id: string
  name: string
  amount: number
  frequency: BudgetFrequency
  share?: number // Percentage paid by user (default 100)
}

export interface BudgetModel {
  income: BudgetItem[]
  personalExpenses: BudgetItem[]
  commonExpenses: BudgetItem[]
  savingsParams: {
    investmentTarget: number // Percentage or amount, to be decided by logic, but simply storing values for now
    savingsTarget: number
  }
  lastUpdated?: Date | Timestamp
}
