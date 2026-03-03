// src/stores/portfolioStore.ts
import { map, computed } from 'nanostores'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getAggregateFromServer,
  sum,
  count,
  type DocumentSnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@shared/lib/firebase'
import { user } from '@features/auth/stores/authStore'
import {
  type AssetModel,
  type TransactionModel,
  type PlatformModel,
  TransactionTypes,
  TransactionImpact
} from '@shared/types'

interface PortfolioState {
  assets: AssetModel[]
  transactions: TransactionModel[]
  platforms: PlatformModel[]
  loading: boolean
  calculatingTotals: boolean // Loading state for dashboard totals
  error: string | null
  lastVisible: DocumentSnapshot | null
  hasMore: boolean
  totalInvested: number // Server-side aggregated
  transactionCount: number // Server-side count
  missingIndex: boolean
  totalsError: string | null
  assetInvestedMap: Record<string, number>
  filters: {
    type: string
    assetId: string
    searchQuery: string
  }
}

export const portfolioStore = map<PortfolioState>({
  assets: [],
  transactions: [],
  platforms: [],
  loading: true, // Start in loading state to prevent "No data" flash
  calculatingTotals: true, // Start true to show skeleton on fresh load
  error: null,
  lastVisible: null,
  hasMore: true,
  totalInvested: 0,
  transactionCount: 0,
  missingIndex: false,
  totalsError: null,
  assetInvestedMap: {},
  filters: {
    type: '',
    assetId: '',
    searchQuery: ''
  }
})

let unsubAssets: Unsubscribe | null = null
let unsubPlatforms: Unsubscribe | null = null

// Subscribe/Unsubscribe based on user state
user.subscribe((currentUser) => {
  if (currentUser) {
    // Assets Subscription (User Level)
    const assetsQuery = collection(db, 'users', currentUser.uid, 'assets')
    unsubAssets = onSnapshot(assetsQuery, (snapshot) => {
      const assetsList: AssetModel[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data()
          }) as AssetModel
      )
      portfolioStore.setKey('assets', assetsList)
    })

    // Platforms Subscription
    const platformsQuery = collection(db, 'users', currentUser.uid, 'platforms')
    unsubPlatforms = onSnapshot(platformsQuery, (snapshot) => {
      const platformsList: PlatformModel[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data()
          }) as PlatformModel
      )
      portfolioStore.setKey('platforms', platformsList)
    })

    // Initial Fetch
    fetchTransactions(true)
    fetchTotals()
  } else {
    // Cleanup
    if (unsubAssets) unsubAssets()
    if (unsubPlatforms) unsubPlatforms()
    portfolioStore.set({
      assets: [],
      transactions: [],
      platforms: [],
      loading: true, // Keep loading state while auth initializes
      calculatingTotals: true, // Keep loading skeleton while auth initializes
      error: null,
      lastVisible: null,
      hasMore: true,
      totalInvested: 0,
      transactionCount: 0,
      missingIndex: false,
      totalsError: null,
      assetInvestedMap: {},
      filters: { type: '', assetId: '', searchQuery: '' }
    })
  }
})

const PAGE_SIZE = 25

export const fetchTransactions = async (reset = false) => {
  const currentUser = user.get()
  if (!currentUser) return

  if (reset) {
    portfolioStore.setKey('transactions', [])
    portfolioStore.setKey('lastVisible', null)
    portfolioStore.setKey('hasMore', true)
  }

  if (!portfolioStore.get().hasMore && !reset) return

  portfolioStore.setKey('loading', true)

  try {
    let q = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      orderBy('date', 'desc'),
      limit(PAGE_SIZE)
    )

    const currentFilters = portfolioStore.get().filters

    if (currentFilters.type) {
      q = query(q, where('type', '==', currentFilters.type))
    }

    if (currentFilters.assetId) {
      q = query(q, where('assetId', '==', currentFilters.assetId))
    }

    const lastVisible = portfolioStore.get().lastVisible
    if (!reset && lastVisible) {
      q = query(q, startAfter(lastVisible))
    }

    const snapshot = await getDocs(q)

    const newTxs: TransactionModel[] = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data()
        }) as TransactionModel
    )

    const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null

    portfolioStore.setKey('lastVisible', lastVisibleDoc)
    portfolioStore.setKey('hasMore', snapshot.docs.length === PAGE_SIZE)

    if (reset) {
      portfolioStore.setKey('transactions', newTxs)
    } else {
      portfolioStore.setKey('transactions', [...portfolioStore.get().transactions, ...newTxs])
    }
  } catch (e) {
    console.error('Error fetching transactions:', e)
    portfolioStore.setKey('error', e instanceof Error ? e.message : 'Unknown error')
  } finally {
    portfolioStore.setKey('loading', false)
  }
}

export const setFilters = (filters: Partial<PortfolioState['filters']>) => {
  const current = portfolioStore.get().filters
  portfolioStore.setKey('filters', { ...current, ...filters })
  fetchTransactions(true)
}

export const ensureAssetInvested = async (assetId: string) => {
  const currentUser = user.get()
  if (!currentUser) return

  try {
    const inQ = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      where('assetId', '==', assetId),
      where('type', 'in', TransactionImpact.Inflow)
    )
    const outQ = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      where('assetId', '==', assetId),
      where('type', 'in', TransactionImpact.Outflow)
    )

    const [inSnap, outSnap] = await Promise.all([
      getAggregateFromServer(inQ, { total: sum('amount') }),
      getAggregateFromServer(outQ, { total: sum('amount') })
    ])

    const net = (inSnap.data().total || 0) - (outSnap.data().total || 0)

    const map = { ...portfolioStore.get().assetInvestedMap }
    map[assetId] = net
    portfolioStore.setKey('assetInvestedMap', map)
  } catch (e) {
    console.error(`Failed to get asset invested amount for ${assetId}`, e)
  }
}

export const fetchTotals = async () => {
  const currentUser = user.get()
  if (!currentUser) return

  // Reset errors
  portfolioStore.setKey('totalsError', null)
  portfolioStore.setKey('missingIndex', false)
  portfolioStore.setKey('calculatingTotals', true)

  try {
    const inQ = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      where('type', 'in', TransactionImpact.Inflow)
    )
    const outQ = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      where('type', 'in', TransactionImpact.Outflow)
    )

    const [inSnap, outSnap] = await Promise.all([
      getAggregateFromServer(inQ, { totalInvested: sum('amount'), count: count() }),
      getAggregateFromServer(outQ, { totalInvested: sum('amount'), count: count() })
    ])

    const inData = inSnap.data()
    const outData = outSnap.data()

    portfolioStore.setKey('totalInvested', (inData.totalInvested || 0) - (outData.totalInvested || 0))
    portfolioStore.setKey('transactionCount', (inData.count || 0) + (outData.count || 0))

    // Refresh requested asset investments
    const currentKeys = Object.keys(portfolioStore.get().assetInvestedMap)
    await Promise.all(currentKeys.map((key) => ensureAssetInvested(key)))
  } catch (e) {
    console.error('Error calculating totals:', e)
    // Expose error to UI
    portfolioStore.setKey('totalsError', e instanceof Error ? e.message : 'Unknown error')

    if (e instanceof Error && 'code' in e) {
      const firebaseError = e as { code?: string }
      if (firebaseError.code === 'failed-precondition') {
        console.warn(
          'Missing Firestore Index. Please verify the console for the index creation link.'
        )
        portfolioStore.setKey('missingIndex', true)
      }
    }
  } finally {
    portfolioStore.setKey('calculatingTotals', false)
  }
}

// Computed values for Dashboard
export const netInvested = computed(portfolioStore, ({ totalInvested }) => {
  return totalInvested
})

export const currentPortfolioValue = computed(portfolioStore, ({ assets }) => {
  return assets.reduce((acc, asset) => acc + (asset.currentValue || 0), 0)
})

export const totalROI = computed([netInvested, currentPortfolioValue], (invested, current) => {
  if (invested === 0) return 0
  return ((current - invested) / invested) * 100
})

export const deleteTransaction = async (transactionId: string) => {
  const currentUser = user.get()
  if (!currentUser) return

  try {
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', transactionId))

    // Refresh
    fetchTransactions(true)
    fetchTotals()
  } catch (e) {
    console.error('Error deleting transaction:', e)
    throw e
  }
}

export const updateTransaction = async (transactionId: string, data: Partial<TransactionModel>) => {
  const currentUser = user.get()
  if (!currentUser) return

  try {
    const { doc, updateDoc } = await import('firebase/firestore')
    const transactionRef = doc(db, 'users', currentUser.uid, 'transactions', transactionId)
    await updateDoc(transactionRef, data)

    // Refresh
    fetchTransactions(true)
    fetchTotals()
  } catch (e) {
    console.error('Error updating transaction:', e)
    throw e
  }
}
