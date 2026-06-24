# Firestore Security Rules Audit Report

This report evaluates the current Firestore security rules ([firestore.rules](file:///Users/f.javierdelcastilloramirez/github/portfolio-manager/firestore.rules)) against a rigorous security checklist, identifying vulnerabilities and recommending remediation steps.

## Executive Summary

| Metric | Value |
| :--- | :--- |
| **Current Score** | **1/5 (Critical)** |
| **Status** | Action Required |
| **Critical Issues** | 1 |
| **Moderate Issues** | 1 |
| **Minor Issues** | 3 |

> [!CAUTION]
> The current rules permit a total whitelist bypass via unverified email accounts, resulting in unauthorized data access (Score: 1/5). Immediate remediation is recommended.

---

## Detailed Findings

### 1. Whitelist Bypass via Unverified Emails
* **Check**: Authority Source / Identity Validation
* **Severity**: `critical`
* **Vulnerability**: The `isWhitelisted()` helper function checks if the user's email is present in the whitelist, but it does not check whether `request.auth.token.email_verified` is true. An attacker can register a new account with any provider using an unverified email address matching a whitelisted target, gaining unauthorized read/write access to that user's portfolio data.
* **Remediation**: Update `isWhitelisted()` to verify that the email is verified:
  ```diff
   function isWhitelisted() {
     return request.auth != null &&
             request.auth.token != null &&
             request.auth.token.email != null &&
+            request.auth.token.email_verified == true &&
             request.auth.token.email in get(/databases/$(database)/documents/config/whitelist).data.emails;
   }
  ```

### 2. Whitelist PII Exposure
* **Check**: PII Exposure / Least Privilege
* **Severity**: `moderate`
* **Vulnerability**: The rules allow any authenticated user to read `/config/whitelist`. This document contains the entire array of whitelisted email addresses. A malicious authenticated user (even one not whitelisted) can extract the complete list of emails, exposing Personally Identifiable Information (PII).
* **Remediation**: Rather than checking the entire list of emails, restructure the database to store individual whitelisted email records where each user can only read their own document (e.g. `/config/whitelist/emails/{email}`), or restrict client access entirely and rely on permissions failures on user-specific paths to determine whitelist status.
  
  *Alternative approach (Restructuring rules and whitelist structure)*:
  ```javascript
  match /config/whitelist/emails/{email} {
    allow read: if request.auth != null && request.auth.token.email == email;
  }
  ```

### 3. Lack of Separated Create and Update Constraints (Update Bypass)
* **Check**: The Update Bypass
* **Severity**: `minor`
* **Vulnerability**: The rules allow `write` operations globally for users and subcollections. This combines `create`, `update`, and `delete` into one permission check. This means that a user could modify immutable fields (e.g., `createdAt`) during an update, which can lead to self-data corruption.
* **Remediation**: Separate `create` and `update` permissions and enforce that immutable fields cannot be changed:
  ```javascript
  allow create: if isOwner(userId) && isWhitelisted();
  allow update: if isOwner(userId) && isWhitelisted() && 
                 !request.resource.data.diff(resource.data).affectedKeys().hasAny(['createdAt']);
  allow delete: if isOwner(userId);
  ```

### 4. Missing Type Safety and Schema Validation
* **Check**: Type Safety
* **Severity**: `minor`
* **Vulnerability**: There are no checks on data types for fields in the `assets`, `transactions`, `platforms`, or `settings` collections. A bug or malicious script could write malformed data (e.g., string instead of number for a transaction amount), leading to application errors or data corruption.
* **Remediation**: Add functions to validate schemas for each collection.
  ```javascript
  function isValidTransaction() {
    let data = request.resource.data;
    return data.amount is number && 
           data.type in ['buy', 'sell'] &&
           data.date is timestamp;
  }
  ```

### 5. Storage Abuse & Resource Exhaustion (DoS)
* **Check**: Storage Abuse
* **Severity**: `minor`
* **Vulnerability**: The rules do not enforce limits on string lengths or array sizes. A user could write a document containing extremely long strings or arrays, consuming excessive Firestore storage and triggering high usage costs.
* **Remediation**: Check and restrict string lengths and array sizes.
  ```javascript
  allow write: if isOwner(userId) && isWhitelisted() && 
                 request.resource.data.name.size() < 100;
  ```

---

## JSON Assessment Summary

```json
{
  "score": 1,
  "summary": "The rules are vulnerable to a critical whitelist bypass due to a missing email verification check. Additionally, there is a moderate risk of PII exposure as any logged-in user can read the entire email whitelist document, along with minor risks of data corruption/resource abuse due to a lack of type safety, update constraints, and size limits.",
  "findings": [
    {
      "check": "Authority Source / Identity Validation",
      "severity": "critical",
      "issue": "isWhitelisted() checks request.auth.token.email but does not ensure request.auth.token.email_verified is true, allowing bypass via unverified emails.",
      "recommendation": "Add request.auth.token.email_verified == true check in isWhitelisted()."
    },
    {
      "check": "PII Exposure / Least Privilege",
      "severity": "moderate",
      "issue": "/config/whitelist allows read access to all authenticated users, exposing the array of all whitelisted emails.",
      "recommendation": "Restructure whitelist checking to avoid exposure of all emails to any user, or secure it at the individual email document level."
    },
    {
      "check": "The Update Bypass",
      "severity": "minor",
      "issue": "Combined read/write rule on collections allows modifying immutable fields on update operations.",
      "recommendation": "Separate create, update, and delete rules, ensuring critical fields are immutable during updates."
    },
    {
      "check": "Type Safety",
      "severity": "minor",
      "issue": "No type validations are present on user collections or subcollections, risking data corruption.",
      "recommendation": "Add type-checking functions for incoming resources on create/update."
    },
    {
      "check": "Storage Abuse / DoS",
      "severity": "minor",
      "issue": "No limit checks on string lengths or array sizes are implemented, exposing to resource exhaustion.",
      "recommendation": "Enforce limits on string lengths and sizes for incoming resources."
    }
  ]
}
```
