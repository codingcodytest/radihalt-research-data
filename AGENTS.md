# Research data delivery

Publish changes through one ready PR to main after focused local validation.
The PR runs `npm run validate`; wait for that complete result and merge only
when it passes. Branch checkpoints and main merges do not repeat the validation.
Batch fixes before updating a ready PR. Do not manually dispatch or blindly
rerun a pending, passing or unchanged failed validation.

Preserve data history, DOI records and integrity manifests. Workflow-only changes
must not change published datasets. This public repository does not need a plan
upgrade or paid runner. Preserve the account-wide US$10 Actions stop budget.
