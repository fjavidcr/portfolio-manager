## 2024-05-24 - Optimizing Date Formatting inside Vue Computed Properties

**Learning:** Calling `Date.prototype.toLocaleString` repeatedly inside a reactive context (like Vue's `computed` property) for large collections is a massive hidden bottleneck. `toLocaleString` re-instantiates locale data for each call, taking ~2 seconds for 10,000 iterations.
**Action:** When formatting dates in a list or loop (especially inside Vue reactive getters), always pre-instantiate an `Intl.DateTimeFormat` object outside the loop and use `formatter.format(date)`, which is around ~100x faster.

## 2025-03-10 - Pre-instantiate DateTimeFormat for faster list rendering

**Learning:** Instantiating `Intl.DateTimeFormat` or calling `.toLocaleDateString()` and `.toLocaleString()` inside Vue components or render loops causes performance bottlenecks, especially in components rendering lists like transactions.
**Action:** Always pre-instantiate `Intl.DateTimeFormat` objects in a centralized utility file and cache them outside of reactive contexts or loops. Update `utils.ts` and use the cached formatters throughout the app.

## 2026-04-04 - Pre-instantiating USD formatter for DcaSummary

**Learning:** Inline calls to `Number.prototype.toLocaleString()` for currency formatting (e.g., USD) in Vue templates or computed properties create a performance bottleneck due to repeated instantiation of `Intl.NumberFormat` locale data.
**Action:** Pre-instantiate `Intl.NumberFormat` objects for secondary currencies (like USD) in `src/shared/lib/utils.ts` and export dedicated formatting functions. This follows the existing project pattern for EUR and date formatting, ensuring ~100x faster execution.
