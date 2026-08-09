import { map, computed } from 'nanostores'
import { user, authLoading } from '@features/auth/stores/authStore'
import { db } from '@shared/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { BudgetModel, BudgetItem } from '@shared/types'

// State
export const budgetStore = map<BudgetModel>({
  income: [],
  personalExpenses: [],
  commonExpenses: [],
  savingsParams: {
    investmentTarget: 0,
    savingsTarget: 0
  }
})

export const budgetStatus = map<{
  loading: boolean
  saving: boolean
  error: string
}>({
  loading: true,
  saving: false,
  error: ''
})

// Computeds
const calculateDirectMonthlyTotal = (items: BudgetItem[]) => {
  return items.reduce((sum, item) => {
    if (item.frequency === 'Annual') return sum
    let amount = item.amount
    if (item.share !== undefined) {
      amount = amount * (item.share / 100)
    }
    return sum + amount
  }, 0)
}

const calculateAnnualReserveMonthlyTotal = (items: BudgetItem[]) => {
  return items.reduce((sum, item) => {
    if (item.frequency !== 'Annual') return sum
    let amount = item.amount
    if (item.share !== undefined) {
      amount = amount * (item.share / 100)
    }
    return sum + amount / 12
  }, 0)
}

const calculateMonthlyTotal = (items: BudgetItem[]) => {
  return calculateDirectMonthlyTotal(items) + calculateAnnualReserveMonthlyTotal(items)
}

export const totalIncome = computed(budgetStore, (s) => calculateMonthlyTotal(s.income))

export const totalPersonalMonthlyDirect = computed(budgetStore, (s) =>
  calculateDirectMonthlyTotal(s.personalExpenses)
)
export const totalPersonalAnnualReserve = computed(budgetStore, (s) =>
  calculateAnnualReserveMonthlyTotal(s.personalExpenses)
)
export const totalPersonalExpenses = computed(
  [totalPersonalMonthlyDirect, totalPersonalAnnualReserve],
  (d, a) => d + a
)

export const totalCommonMonthlyDirect = computed(budgetStore, (s) =>
  calculateDirectMonthlyTotal(s.commonExpenses)
)
export const totalCommonAnnualReserve = computed(budgetStore, (s) =>
  calculateAnnualReserveMonthlyTotal(s.commonExpenses)
)
export const totalCommonExpenses = computed(
  [totalCommonMonthlyDirect, totalCommonAnnualReserve],
  (d, a) => d + a
)

export const totalDirectMonthlyExpenses = computed(
  [totalPersonalMonthlyDirect, totalCommonMonthlyDirect],
  (p, c) => p + c
)
export const totalAnnualReserveExpenses = computed(
  [totalPersonalAnnualReserve, totalCommonAnnualReserve],
  (p, c) => p + c
)
export const totalExpenses = computed([totalPersonalExpenses, totalCommonExpenses], (p, c) => p + c)

// Helper to sanitize items from Firestore
const sanitizeItems = (items: BudgetItem[] = []): BudgetItem[] => {
  return items.map((item) => ({
    ...item,
    frequency: item.frequency || 'Monthly'
  }))
}

// Actions
export const loadBudget = async (uid: string) => {
  budgetStatus.setKey('loading', true)
  budgetStatus.setKey('error', '')

  try {
    const docRef = doc(db, 'users', uid, 'settings', 'budget')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data() as BudgetModel
      budgetStore.set({
        income: sanitizeItems(data.income),
        personalExpenses: sanitizeItems(data.personalExpenses),
        commonExpenses: sanitizeItems(data.commonExpenses),
        savingsParams: {
          investmentTarget: data.savingsParams?.investmentTarget || 0,
          savingsTarget: data.savingsParams?.savingsTarget || 0
        },
        lastUpdated: data.lastUpdated
      })
    } else {
      // Reset if new user/no doc
      budgetStore.set({
        income: [],
        personalExpenses: [],
        commonExpenses: [],
        savingsParams: { investmentTarget: 0, savingsTarget: 0 }
      })
    }
  } catch (e) {
    console.error('Error loading budget:', e)
    budgetStatus.setKey('error', 'Failed to load budget data.')
  } finally {
    budgetStatus.setKey('loading', false)
  }
}

export const saveBudget = async () => {
  const $user = user.get()
  if (!$user) return

  budgetStatus.setKey('saving', true)
  try {
    const data = budgetStore.get()
    const payload = {
      ...data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastUpdated: serverTimestamp() as any
    }
    await setDoc(doc(db, 'users', $user.uid, 'settings', 'budget'), payload)
  } catch (e) {
    console.error('Error saving budget:', e)
    // You might want to set an error state here or handle it in UI
  } finally {
    budgetStatus.setKey('saving', false)
  }
}

export const updateSection = async (
  section: 'income' | 'personalExpenses' | 'commonExpenses',
  items: BudgetItem[]
) => {
  budgetStore.setKey(section, items)
  await saveBudget()
}

export const updateTargets = (investment: number, savings: number) => {
  const current = budgetStore.get().savingsParams
  budgetStore.setKey('savingsParams', {
    ...current,
    investmentTarget: investment,
    savingsTarget: savings
  })
}

// Auto-load subscription
user.subscribe((u) => {
  const isAuthLoading = authLoading.get()
  if (u) {
    loadBudget(u.uid)
  } else if (!isAuthLoading) {
    budgetStatus.setKey('loading', false)
  }
})

authLoading.subscribe((loading) => {
  const $user = user.get()
  if (!loading && !$user) {
    budgetStatus.setKey('loading', false)
  }
})
