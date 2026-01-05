// src/stores/portfolioStore.ts
import { map, computed } from 'nanostores';
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
} from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { user } from '@features/auth/stores/authStore';
import type { AssetModel, TransactionModel, PlatformModel } from '@shared/types';

interface PortfolioState {
    assets: AssetModel[];
    transactions: TransactionModel[];
    platforms: PlatformModel[];
    loading: boolean;
    error: string | null;
    lastVisible: DocumentSnapshot | null;
    hasMore: boolean;
    totalInvested: number; // Server-side aggregated
    transactionCount: number; // Server-side count
    missingIndex: boolean;
    totalsError: string | null;
}

export const portfolioStore = map<PortfolioState>({
    assets: [],
    transactions: [],
    platforms: [],
    loading: false,
    error: null,
    lastVisible: null,
    hasMore: true,
    totalInvested: 0,
    transactionCount: 0,
    missingIndex: false,
    totalsError: null,
});

let unsubAssets: Unsubscribe | null = null;
let unsubPlatforms: Unsubscribe | null = null;
// Removed global transactions listener

// Subscribe/Unsubscribe based on user state
user.subscribe((currentUser) => {
    if (currentUser) {
        // Assets Subscription (User Level)
        const assetsQuery = collection(db, 'users', currentUser.uid, 'assets');
        unsubAssets = onSnapshot(assetsQuery, (snapshot) => {
            const assetsList: AssetModel[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AssetModel));
            portfolioStore.setKey('assets', assetsList);
        });

        // Platforms Subscription
        const platformsQuery = collection(db, 'users', currentUser.uid, 'platforms');
        unsubPlatforms = onSnapshot(platformsQuery, (snapshot) => {
            const platformsList: PlatformModel[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PlatformModel));
            portfolioStore.setKey('platforms', platformsList);
        });

        // Initial Fetch
        fetchTransactions(true);
        fetchTotals();

    } else {
        // Cleanup
        if (unsubAssets) unsubAssets();
        if (unsubPlatforms) unsubPlatforms();
        portfolioStore.set({
            assets: [],
            transactions: [],
            platforms: [],
            loading: false,
            error: null,
            lastVisible: null,
            hasMore: true,
            totalInvested: 0,
            transactionCount: 0,
            missingIndex: false,
            totalsError: null
        });
    }
});

const PAGE_SIZE = 20;

export const fetchTransactions = async (reset = false) => {
    const currentUser = user.get();
    if (!currentUser) return;

    if (reset) {
        portfolioStore.setKey('transactions', []);
        portfolioStore.setKey('lastVisible', null);
        portfolioStore.setKey('hasMore', true);
    }

    if (!portfolioStore.get().hasMore && !reset) return;

    portfolioStore.setKey('loading', true);

    try {
        let q = query(
            collection(db, 'users', currentUser.uid, 'transactions'),
            orderBy('date', 'desc'),
            limit(PAGE_SIZE)
        );

        const lastVisible = portfolioStore.get().lastVisible;
        if (!reset && lastVisible) {
            q = query(q, startAfter(lastVisible));
        }

        const snapshot = await getDocs(q);

        const newTxs: TransactionModel[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as TransactionModel));

        const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;

        portfolioStore.setKey('lastVisible', lastVisibleDoc);
        portfolioStore.setKey('hasMore', snapshot.docs.length === PAGE_SIZE);

        if (reset) {
            portfolioStore.setKey('transactions', newTxs);
        } else {
            portfolioStore.setKey('transactions', [...portfolioStore.get().transactions, ...newTxs]);
        }

    } catch (e: any) {
        console.error("Error fetching transactions:", e);
        portfolioStore.setKey('error', e.message);
    } finally {
        portfolioStore.setKey('loading', false);
    }
};

export const fetchTotals = async () => {
    const currentUser = user.get();
    if (!currentUser) return;

    // Reset errors
    portfolioStore.setKey('totalsError', null);
    portfolioStore.setKey('missingIndex', false);

    try {
        const validTypes = ['Plan', 'Aportación', 'Retirada', 'Dividendo', 'Traspaso', 'Venta'];

        // Optimisation: Use server-side aggregation to avoid downloading all documents.
        // We filter by 'type' in validTypes and sum the 'amount'.
        // Note: 'in' operator combined with aggregation requires a composite index.

        const q = query(
            collection(db, 'users', currentUser.uid, 'transactions'),
            where('type', 'in', validTypes)
        );

        const snapshot = await getAggregateFromServer(q, {
            totalInvested: sum('amount'),
            count: count()
        });

        const data = snapshot.data();
        portfolioStore.setKey('totalInvested', data.totalInvested || 0);
        portfolioStore.setKey('transactionCount', data.count || 0);

    } catch (e: any) {
        console.error("Error calculating totals:", e);
        // Expose error to UI
        portfolioStore.setKey('totalsError', e.message || 'Unknown error');

        if (e.code === 'failed-precondition') {
            console.warn("Missing Firestore Index. Please verify the console for the index creation link.");
            portfolioStore.setKey('missingIndex', true);
        }
    }
}


// Computed values for Dashboard
export const netInvested = computed(portfolioStore, ({ totalInvested }) => {
    return totalInvested;
});

export const currentPortfolioValue = computed(portfolioStore, ({ assets }) => {
    return assets.reduce((acc, asset) => acc + (asset.currentValue || 0), 0);
});

export const totalROI = computed([netInvested, currentPortfolioValue], (invested, current) => {
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
});

export const deleteTransaction = async (transactionId: string) => {
    const currentUser = user.get();
    if (!currentUser) return;

    try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', transactionId));

        // Refresh
        fetchTransactions(true);
        fetchTotals();
    } catch (e) {
        console.error("Error deleting transaction:", e);
        throw e;
    }
};

export const updateTransaction = async (transactionId: string, data: Partial<TransactionModel>) => {
    const currentUser = user.get();
    if (!currentUser) return;

    try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const transactionRef = doc(db, 'users', currentUser.uid, 'transactions', transactionId);
        await updateDoc(transactionRef, data);

        // Refresh
        fetchTransactions(true);
        fetchTotals();
    } catch (e) {
        console.error("Error updating transaction:", e);
        throw e;
    }
};
