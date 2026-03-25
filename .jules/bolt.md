## 2024-05-24 - Optimizing Date Formatting inside Vue Computed Properties

**Learning:** Calling `Date.prototype.toLocaleString` repeatedly inside a reactive context (like Vue's `computed` property) for large collections is a massive hidden bottleneck. `toLocaleString` re-instantiates locale data for each call, taking ~2 seconds for 10,000 iterations.
**Action:** When formatting dates in a list or loop (especially inside Vue reactive getters), always pre-instantiate an `Intl.DateTimeFormat` object outside the loop and use `formatter.format(date)`, which is around ~100x faster.

## 2025-03-10 - Pre-instantiate DateTimeFormat for faster list rendering

**Learning:** Instantiating `Intl.DateTimeFormat` or calling `.toLocaleDateString()` and `.toLocaleString()` inside Vue components or render loops causes performance bottlenecks, especially in components rendering lists like transactions.
**Action:** Always pre-instantiate `Intl.DateTimeFormat` objects in a centralized utility file and cache them outside of reactive contexts or loops. Update `utils.ts` and use the cached formatters throughout the app.

## 2025-03-10 - Replace inline toLocaleString with cached Intl.NumberFormat

**Learning:** Using `toLocaleString` inline within Vue templates (e.g., `{{ value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}`) causes `Intl.NumberFormat` to be instantiated on every re-render. This is an expensive operation that can cause significant frame drops and main thread blocking, especially when rendered frequently.
**Action:** Always pre-instantiate `Intl.NumberFormat` in a shared utility file (e.g., `utils.ts`) and expose a formatting function (e.g., `formatCurrencyUSD(value)`). Use this function in Vue templates to bypass the repeated instantiation cost.
