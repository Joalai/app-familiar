# App Familiar · Stability baseline

## Rollback point

Production baseline captured before the 2026-09-20 stabilization:

- Git commit: `67e5fc6b3af23b9805fc66a34e5dcb4c2c1fd49d`
- Backup branch: `backup/pre-stabilization-2026-09-20`
- Database snapshot schema: `backup_pre_stabilization_20260920`
- Snapshot app version: `2026.09.19.7`

The snapshot schema is private and direct access is revoked from `public`, `anon`, and `authenticated`.

## Rollback procedure

### Code-only rollback

Move `main` back to the baseline commit above and deploy GitHub Pages. This does not require restoring database data and therefore preserves family data added after the stabilization.

### Data rollback

Only use the database snapshot if data itself was corrupted. Before restoring snapshot tables, export/copy any rows created after the snapshot so they can be merged back. A full snapshot restore would otherwise discard post-snapshot changes.

## Stability rules

1. One active implementation per feature. Legacy modules must not be loaded beside replacements.
2. No dynamic script injection from application JavaScript or the service worker.
3. Background synchronization may fetch every 15 seconds, but must not redraw while a form has unsaved changes.
4. No UI polling loops for layout, tasks, cars, or notifications. Refresh those from explicit data/navigation events.
5. New app versions never force-reload an open client. The user chooses when to apply an available update.
6. Every local JavaScript file loaded by `index.html` must be pinned to exactly the same version as `version.json`, `APP_VERSION`, and `APP_PATCH_VERSION`.
7. GitHub Actions validates syntax and architecture but must never rewrite production files automatically.
8. Client-side JavaScript exceptions are logged privately for diagnostics; no document numbers or form contents are intentionally included.
9. Database migrations should be additive where possible. Destructive migrations require a fresh snapshot first.
10. Before merging to `main`, the stability workflow must be green.

## Critical smoke paths

After a material UI change, verify at least:

- Home opens and “Lo que viene” renders.
- Week and Month open.
- Add/edit/delete plan or birthday.
- Add/edit health appointment.
- Add/edit one-off routine.
- Add/edit/delete car appointment from the calendar at first tap.
- Car history and vehicle card render.
- Add/edit/complete task.
- Shopping add/complete.
- Packing opens.
- Documentation locked screen opens.
- Inbox opens.
- Subscriptions opens.
- Returning to the app from background does not erase a partially edited form.
- A new deployed version shows the update prompt instead of reloading automatically.
