# Repository safety rules

## Production QA

- Never run Production QA with a real user email or user ID.
- Production QA that creates data must use a new isolated QA account and UUID `run_id`.
- Import and execute the guards in `scripts/production-qa/guard.ts` before the first write.
- Add the generated run marker to QA rows so cleanup can find records even when `project_id` becomes `NULL`.
- Cleanup must remove Storage objects and the isolated QA auth user, then verify zero rows across projects, events, checklists, reservations, budgets, expenses, notes, and files.
- Page-entry QA should be read-only unless the scenario explicitly tests a create, update, or delete action.
