## 2024-03-12 - Missing Input Validation in Vue Forms

**Vulnerability:** Vue form components (`AddAssetForm.vue`, `AddTransactionForm.vue`) lack structural constraints like `maxlength` and explicit client-side length validation before submitting data to Firebase, creating a risk of database bloat and potential DoS vectors.
**Learning:** In Astro + Vue integrations using Firebase, missing input length limits on the frontend can allow oversized strings to be sent directly to Firestore if security rules do not enforce string limits.
**Prevention:** Always add sensible `maxlength` attributes to text inputs and `max` constraints to number inputs in Vue components, and validate these lengths in the component's `handleSubmit` function before making Firestore API calls.
