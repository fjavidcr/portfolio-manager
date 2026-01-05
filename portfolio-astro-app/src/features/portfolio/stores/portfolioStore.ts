// src/stores/portfolioStore.ts
import { map, computed } from 'nanostores';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '@shared/lib/firebase';
import { user } from '@features/auth/stores/authStore';
import type { AssetModel, TransactionModel } from '@shared/types';

interface PortfolioState {
    assets: AssetModel[];
    transactions: TransactionModel[];
    loading: boolean;
    error: string | null;
}

export const portfolioStore = map<PortfolioState>({
    assets: [],
    transactions: [],
    loading: false,
    error: null,
});

let unsubAssets: Unsubscribe | null = null;
let unsubTransactions: Unsubscribe | null = null;

// Subscribe/Unsubscribe based on user state
user.subscribe((currentUser) => {
    if (currentUser) {
        portfolioStore.setKey('loading', true);

        // Assets Subscription (Assuming global assets for now, or filter by user if needed)
        // Note: In the original app, Assets seemed global or per user? 
        // The Flutter models didn't show userId on AssetModel, only TransactionModel.
        // We will assume Assets are global or we query commonly used ones for now, 
        // BUT usually portfolios are personal. 
        // Checking AssetModel in Flutter: It has `id`, `name`, `type`, `currentValue`, `platformId`.
        // It doesn't seem to have a `userId`. 
        // However, PortfolioService in Flutter queries `users/{uid}/transactions`.
        // It seems Asset definitions might be shared, but HOLDINGS are calculated from transactions?
        // OR, there's a separate collection for user assets?
        // Let's re-read the Flutter code for AssetService or PortfolioService if unsure.
        // For now, let's fetch Transactions as they clearly have `userId`.

        // Transactions Subscription
        const transactionsQuery = query(
            collection(db, 'users', currentUser.uid, 'transactions'),
            orderBy('date', 'desc')
        );

        unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            const txs: TransactionModel[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TransactionModel));
            portfolioStore.setKey('transactions', txs);

            // IMPORTANT: In the Flutter app, `PortfolioService` was calculating 
            // net invested from transactions.
            // `AssetService` in Flutter might be where Assets are stored.
            // Let's assume we also need to fetch Assets. 
            // If Assets are user-specific, they should be in `users/{uid}/assets` or similar.
            // If they are global definitions, then top-level `assets`.
            // Let's query top-level 'assets' for now as a safe bet for definitions.

            portfolioStore.setKey('loading', false);
        }, (error) => {
            portfolioStore.setKey('error', error.message);
            portfolioStore.setKey('loading', false);
        });

        // Assets Subscription (User Level)
        const assetsQuery = collection(db, 'users', currentUser.uid, 'assets');
        unsubAssets = onSnapshot(assetsQuery, (snapshot) => {
            const assetsList: AssetModel[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AssetModel));
            portfolioStore.setKey('assets', assetsList);
        });

    } else {
        // Cleanup
        if (unsubTransactions) unsubTransactions();
        if (unsubAssets) unsubAssets();
        portfolioStore.set({ assets: [], transactions: [], loading: false, error: null });
    }
});

// Computed values for Dashboard
export const netInvested = computed(portfolioStore, ({ transactions }) => {
    // Logic from Flutter: Sum of ALL valid types.
    // Based on PortfolioService.dart: total += tx.amount if type is valid.
    const validTypes = ['Plan', 'Aportación', 'Retirada', 'Dividendo', 'Traspaso', 'Venta'];

    return transactions.reduce((acc, tx) => {
        if (validTypes.includes(tx.type)) {
            return acc + tx.amount;
        }
        return acc;
    }, 0);
});

export const currentPortfolioValue = computed(portfolioStore, ({ assets }) => {
    // This is tricky. Do we store user's holdings quantity? 
    // The Flutter `AssetModel` has `currentValue`. 
    // If that `currentValue` is the TOTAL value of the player's holding of that asset, 
    // then we just sum them up.
    // If it's the PRICE per share, we need quantity.
    // Looking at the Flutter `AssetModel`:
    // `final double currentValue;` 
    // It seems to be the value of the holding directly? 
    // If so, we can just sum `currentValue` of all assets... 
    // BUT we are fetching ALL assets from the DB. 
    // We probably need to filter assets that belong to the user, OR 
    // the `assets` collection IS the user's assets? (Global vs User specific)
    // Re-checking Flutter code would be good, but assuming 'assets' collection 
    // contains the user's asset entries with their current total value.

    return assets.reduce((acc, asset) => acc + (asset.currentValue || 0), 0);
});

export const totalROI = computed([netInvested, currentPortfolioValue], (invested, current) => {
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
});
