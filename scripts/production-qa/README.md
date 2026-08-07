# Production QA safety

Production QA may write data only after creating an isolated account for that run.

## Required workflow

1. Generate a UUID `run_id`.
2. Derive the account and marker with `buildProductionQaIdentity(run_id)`.
3. Create that generated QA account with the Supabase Admin API.
4. Resolve the created account ID and call `assertIsolatedProductionQaIdentity`.
5. Put the marker in every QA row that supports a memo field. Prefix a user-visible QA title when no memo field exists.
6. Never look up or reuse a real email address or user ID for QA.
7. Remove Storage objects, then delete the isolated QA auth user so user-owned rows cascade even when `project_id` became `NULL`.
8. Query every related table by QA user and run marker. Call `assertProductionQaCleanupComplete` only after all counts are zero.

The required zero-count set is:

- `projects`
- `events`, including rows whose `project_id` is `NULL`
- `project_checklist_items`
- `project_reservations`
- `project_budgets`
- `project_expenses`
- `project_notes`
- `project_places`
- `project_files`
- `storage.objects`

Service-role credentials must stay in process memory. Do not print keys, request bodies, user data, or signed URLs.
