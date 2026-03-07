## 2024-05-24 - Optimizing Date Formatting inside Vue Computed Properties

**Learning:** Calling `Date.prototype.toLocaleString` repeatedly inside a reactive context (like Vue's `computed` property) for large collections is a massive hidden bottleneck. `toLocaleString` re-instantiates locale data for each call, taking ~2 seconds for 10,000 iterations.
**Action:** When formatting dates in a list or loop (especially inside Vue reactive getters), always pre-instantiate an `Intl.DateTimeFormat` object outside the loop and use `formatter.format(date)`, which is around ~100x faster.
