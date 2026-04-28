# Job Posting Workflow — Edge Case Audit

Scope: Create → Edit → Status Change → Delete → Payout  
Categories: 🔒 Security | 🗄️ Data Integrity | 🎨 UX/Resilience  
Severity: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 1. 🔒 Client-Supplied Role Bypass (🔴 Critical)
- **Where:** `server/api/jobs/index.get.ts:28-36`
- **Gap:** `query.role` and `query.scope` from URL params are trusted without server-side verification against `profiles.roles`.
- **Risk:** A worker or unauthenticated user could request `?role=employer&scope=mine` and potentially enumerate private jobs if RLS gaps exist.
- **Fix:** Resolve the actual user role from the DB and ignore client-supplied role for auth decisions.

## 2. 🔒 Unauthenticated Nearby Job Search (🟠 High)
- **Where:** `server/api/jobs/near.get.ts`
- **Gap:** No authentication required; no rate limiting.
- **Risk:** Mass scraping of lat/lng + postcode data exposing employer locations.
- **Fix:** Require auth; add rate limiting; coarsen coordinates in response.

## 3. 🗄️ Deletion Leaves Orphaned Records (🟠 High)
- **Where:** `server/api/jobs/[id].delete.ts:14-35`
- **Gap:** No check for existing applications or contracts before deleting. Relies on DB FK/RLS without graceful handling.
- **Risk:** Hard 500 errors from FK constraints, or orphaned records if no cascade.
- **Fix:** Return `409 Conflict` if applications/contracts exist, or switch to soft deletes (`deleted_at`).

## 4. 🗄️ Arbitrary Status Transitions (🟠 High)
- **Where:** `server/api/jobs/[id].patch.ts` / `pages/jobs/[id].vue:242-261`
- **Gap:** Any status can become any other (e.g., `completed` → `draft`). Payout fires on every `completed` transition.
- **Risk:** Re-opening completed jobs after receiving work; duplicate payouts.
- **Fix:** Enforce a state machine server-side: `draft ↔ open → closed → completed` (terminal).

## 5. 🗄️ Payout Without Active Contract Check (🟠 High)
- **Where:** `pages/jobs/[id].vue:263-283` + `server/api/payments/payout.post.ts`
- **Gap:** Only checks `payout_status === 'pending'`, not whether contract `status === 'active'`.
- **Risk:** Payout on a pending/voided contract.
- **Fix:** Verify `contract.status === 'active'` in both client trigger logic and payout endpoint.

## 6. 🗄️ Duplicate Contract Race Condition (🟠 High)
- **Where:** `server/api/applications/[id].patch.ts:84-124`
- **Gap:** Two concurrent "accept" requests can both pass the `existingContract` check and insert duplicates.
- **Risk:** Double contracts and potential double payout.
- **Fix:** Add a unique DB constraint on `contracts.application_id`; use a DB transaction.

## 7. 🗄️ Budget Validation Inconsistency (🟡 Medium)
- **Where:** `server/utils/jobValidation.ts:3-18` vs `schemas/job.ts:29-32`
- **Gap:** Legacy validation caps at 10,000; Zod allows 1,000,000.
- **Risk:** Inconsistent behavior depending on which validator runs.
- **Fix:** Align both to the same limit. Remove legacy validator and rely on Zod.

## 8. 🗄️ Editing Job with Active Applicants Silently Changes Terms (🟡 Medium)
- **Where:** `server/api/jobs/[id].patch.ts:26-65`
- **Gap:** Employers can change budget, deadline, or description after workers have already applied.
- **Risk:** Bait-and-switch on job terms; applicants agreed to different conditions.
- **Fix:** Block edits on fields like `budget_amount`, `budget_type`, `deadline` once at least one application exists, or require applicant notification.

## 9. 🗄️ No Server-Side Deadline Re-validation on Edit (🟡 Medium)
- **Where:** `server/api/jobs/[id].patch.ts`
- **Gap:** `validateUpdateJob` validates the deadline format, but does not re-check if it is still in the future relative to `now()` at update time.
- **Risk:** An employer could shift a past deadline into the future without consequence, or a stale edit could set a past deadline.
- **Fix:** Re-validate `deadline > now()` on every update where the deadline field is provided.

## 10. 🎨 Double-Submit / No Request Deduplication (🟡 Medium)
- **Where:** `pages/jobs/new.vue:226-251`
- **Gap:** `submitting` flag disables the button, but a fast network retry or accidental double-click before Vue re-renders could fire two POSTs.
- **Risk:** Duplicate job postings.
- **Fix:** Generate a client-side `request_id` (UUID) and send it with the payload. Store it server-side (e.g., `jobs.client_request_id` with a unique constraint) for 5-minute deduplication.

## 11. 🎨 No Dirty-Form Warning on Cancel (🟢 Low)
- **Where:** `pages/jobs/new.vue:253-255`
- **Gap:** Clicking Cancel discards all form data immediately without confirmation.
- **Risk:** Accidental data loss after typing a long description.
- **Fix:** Track `isDirty` state; show a confirmation modal before navigating away.

## 12. 🗄️ Category Existence Not Verified on Update (🟢 Low)
- **Where:** `server/api/jobs/[id].patch.ts:44-54`
- **Gap:** If `body.category_id` is provided, it is validated. But if `category_id` is omitted from the update, the job could be left pointing to a category that was later deleted.
- **Risk:** Stale references. The DB FK constraint should catch this, but a soft-deleted category could leave a dangling reference.
- **Fix:** Ensure FK constraints exist at the DB level; consider soft deletes for categories with an `is_active` flag.

---

*End of audit. 12 edge cases identified across the full job lifecycle.*
