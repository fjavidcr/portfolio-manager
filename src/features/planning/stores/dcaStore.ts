import { map, computed } from 'nanostores'
import { user, authLoading } from '@features/auth/stores/authStore'
import { db } from '@shared/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { DcaPlanModel, DcaGoal, DcaPlanItem } from '@shared/types'
import { portfolioStore } from '@shared/stores/portfolioStore'

// State
export const dcaStore = map<DcaPlanModel>({
  goals: [],
  items: []
})

export const dcaStatus = map<{
  loading: boolean
  saving: boolean
  error: string
}>({
  loading: true,
  saving: false,
  error: ''
})

// Computeds
export const dcaItemsWithAssets = computed([dcaStore, portfolioStore], ($dca, $portfolio) => {
  return $dca.items.map(item => {
    const asset = $portfolio.assets.find(a => a.id === item.assetId)
    const platform = $portfolio.platforms.find(p => p.id === asset?.platformId)
    return {
      ...item,
      assetName: asset?.name || 'Unknown Asset',
      assetType: asset?.type || 'Global',
      platformName: platform?.name || 'Unknown Platform',
      ticker: asset?.id || ''
    }
  })
})

export const totalDcaEuros = computed(dcaStore, (s) => 
  s.goals.reduce((sum, g) => sum + g.euros, 0)
)

// Actions
export const loadDcaPlan = async (uid: string) => {
  dcaStatus.setKey('loading', true)
  dcaStatus.setKey('error', '')

  try {
    const docRef = doc(db, 'users', uid, 'settings', 'dca_plan')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data() as DcaPlanModel
      dcaStore.set({
        goals: data.goals || [],
        items: data.items || [],
        lastUpdated: data.lastUpdated
      })
    } else {
      // Initialize with empty or defaults
      dcaStore.set({
        goals: [],
        items: []
      })
    }
  } catch (e) {
    console.error('Error loading DCA plan:', e)
    dcaStatus.setKey('error', 'Failed to load planning data.')
  } finally {
    dcaStatus.setKey('loading', false)
  }
}

export const saveDcaPlan = async () => {
  const $user = user.get()
  if (!$user) return

  dcaStatus.setKey('saving', true)
  try {
    const data = dcaStore.get()
    const payload = {
      ...data,
      lastUpdated: serverTimestamp() as any
    }
    await setDoc(doc(db, 'users', $user.uid, 'settings', 'dca_plan'), payload)
  } catch (e) {
    console.error('Error saving DCA plan:', e)
    dcaStatus.setKey('error', 'Failed to save planning data.')
  } finally {
    dcaStatus.setKey('saving', false)
  }
}

export const updateGoal = (goal: DcaGoal) => {
  const current = dcaStore.get().goals
  const index = current.findIndex(g => g.id === goal.id)
  if (index !== -1) {
    const next = [...current]
    next[index] = goal
    dcaStore.setKey('goals', next)
  } else {
    dcaStore.setKey('goals', [...current, goal])
  }
  saveDcaPlan()
}

export const updatePlanValues = (goals: DcaGoal[], items: DcaPlanItem[]) => {
  dcaStore.set({
    ...dcaStore.get(),
    goals,
    items
  })
  saveDcaPlan()
}

export const addGoal = (name: string) => {
  const current = dcaStore.get()
  const newGoal: DcaGoal = {
    id: crypto.randomUUID(),
    name,
    euros: 0,
    percentage: 0
  }
  dcaStore.setKey('goals', [...current.goals, newGoal])
  saveDcaPlan()
}

export const deleteGoal = (id: string) => {
  const current = dcaStore.get()
  dcaStore.set({
    ...current,
    goals: current.goals.filter(g => g.id !== id),
    items: current.items.filter(i => i.goalId !== id)
  })
  saveDcaPlan()
}

export const addPlanItem = (assetId: string, goalId: string) => {
  const current = dcaStore.get()
  // Check if already exists for this goal
  if (current.items.some(i => i.assetId === assetId && i.goalId === goalId)) return

  const newItem: DcaPlanItem = {
    id: crypto.randomUUID(),
    assetId,
    goalId,
    percentage: 0
  }
  dcaStore.setKey('items', [...current.items, newItem])
  saveDcaPlan()
}

export const deletePlanItem = (id: string) => {
  const current = dcaStore.get()
  dcaStore.setKey('items', current.items.filter(i => i.id !== id))
  saveDcaPlan()
}

// Auto-load subscription
user.subscribe((u) => {
  if (u) {
    loadDcaPlan(u.uid)
  }
})
