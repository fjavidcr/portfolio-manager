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
const calculateMonthlyTotal = (items: BudgetItem[]) => {
  return items.reduce((sum, item) => {
    let amount = item.amount
    // Apply share percentage if present
    if (item.share !== undefined) {
      amount = amount * (item.share / 100)
    }
    if (item.frequency === 'Annual') amount = amount / 12
    return sum + amount
  }, 0)
}

export const totalIncome = computed(budgetStore, (s) => calculateMonthlyTotal(s.income))
export const totalPersonalExpenses = computed(budgetStore, (s) =>
  calculateMonthlyTotal(s.personalExpenses)
)
export const totalCommonExpenses = computed(budgetStore, (s) =>
  calculateMonthlyTotal(s.commonExpenses)
)
export const totalExpenses = computed([totalPersonalExpenses, totalCommonExpenses], (p, c) => p + c)

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
        income: data.income || [],
        personalExpenses: data.personalExpenses || [],
        commonExpenses: data.commonExpenses || [],
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

export const updateSection = (
  section: 'income' | 'personalExpenses' | 'commonExpenses',
  items: BudgetItem[]
) => {
  budgetStore.setKey(section, items)
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
