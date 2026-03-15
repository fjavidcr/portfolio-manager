## 2024-05-16 - [Missing Input Length Validations]

**Vulnerability:** Found missing `maxlength` properties on string inputs and `max` values on numeric inputs, like asset names or transaction descriptions.
**Learning:** This architectural gap could lead to Denial of Service (DoS) attacks or database bloat if users submit excessively large inputs.
**Prevention:** Always implement max boundaries on form fields and validate sizes defensively to ensure inputs cannot be excessively long.
