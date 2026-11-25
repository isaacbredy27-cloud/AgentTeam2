# Deploys and rollback

Source: https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/ (read 2026-11-25)

- Roll back with **Publish Deploy** on any earlier successful deploy. "This doesn’t trigger a new deploy but instead publishes a previous atomic deploy." "Rollbacks are instantaneous."
- **Lock to stop auto publishing** pins the live deploy. New deploys still build but do not publish. Unlock to resume.
- Statuses: Successful; Unsuccessful (Failed, Canceled, Skipped); Enqueued; Pending review / Accepted / Rejected for unrecognized authors.
- Functions are immutable per deploy, so a rollback brings back that deploy's functions (Functions overview page).

## How we apply it
An approved console commit lands on `main` and deploys at once. If it breaks production:
1. Publish the previous deploy. 2. Lock auto publishing if needed. 3. Revert the commit. 4. Unlock.
