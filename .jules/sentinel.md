
## 2026-03-14 - [Security Improvement] Add Input Length Limits
**Vulnerability:** Vue forms and inputs lacking explicit `maxlength` or `max` properties.
**Learning:** This missing limit exposes the application to DoS attacks and database bloat when accepting arbitrarily large values or strings.
**Prevention:** Apply defensive boundaries like `maxlength` and `max` constraints on all client-facing text and number inputs.
