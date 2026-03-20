## 2024-05-16 - [Missing Input Length Validations]

**Vulnerability:** Found missing `maxlength` properties on string inputs and `max` values on numeric inputs, like asset names or transaction descriptions.
**Learning:** This architectural gap could lead to Denial of Service (DoS) attacks or database bloat if users submit excessively large inputs.
**Prevention:** Always implement max boundaries on form fields and validate sizes defensively to ensure inputs cannot be excessively long.

## 2024-03-18 - [Frontend-Only Authorization Bypass]

**Vulnerability:** Whitelist validation was only enforced on the frontend in `authStore.ts`, while `firestore.rules` lacked backend enforcement.
**Learning:** Security controls enforced only on the client-side can be easily bypassed by interacting directly with the backend API (Firestore).
**Prevention:** Always enforce authorization and business logic (like whitelists) on the backend (e.g., in `firestore.rules`) to ensure true security, using the frontend checks only for UX purposes.
