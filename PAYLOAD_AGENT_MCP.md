# Payload agent MCP

This app exposes a deliberately small Payload MCP surface for AI content agents. It is disabled by
default and runs inside the existing Next.js/Payload application; it does not require Cloudflare,
Nginx, VPN, or staging Basic Auth changes.

## What agents can do

- Find and read Pages and Posts in one explicit locale.
- Create validated Post drafts and update selected Post draft fields.
- Create a Page draft by cloning an existing Page as a trusted template, then patch `title`, `slug`,
  SEO `meta`, or bounded plain-text fields on supported existing landing blocks. Agents target block
  IDs returned by `get_content`; they cannot replace or reorder raw layout data.
- Upload one validated JPEG, PNG, WebP, or GIF for use in a draft.
- Soft-trash and restore draft Pages and Posts. Media removal remains an admin task so an agent
  cannot break published content by removing a referenced asset.
- Plan up to 20 Page/Post creates or updates as one bulk operation, wait for admin approval, then
  commit the approved plan atomically.

There is no agent tool for publishing, changing globals/navigation, managing users or keys, editing
forms/redirects/search, restoring Payload versions, or permanently deleting data.

## Roles and request boundary

There are only two roles:

- `admin`: the existing human access level. Admins continue to use `/cms/admin` normally and manage
  agent users, keys, approvals, and publishing.
- `agent-editor`: a machine identity. It can read or mutate non-public content only when the request
  came through the MCP endpoint. Its normal REST, GraphQL, and Admin access cannot bypass MCP tool
  scopes, validation, quotas, or audit logging.

Existing users are assigned `admin` by the migration, so the role field does not require a user
backfill or interrupt current editor access.

## Local setup

1. Start Postgres and apply the checked-in migrations:

   ```bash
   docker compose up -d postgres
   npm run migrate
   ```

2. Set `MCP_ENABLED=true` in the local `.env`, then start the app:

   ```bash
   npm run dev
   ```

3. Sign in at `http://localhost:3000/cms/admin` as an existing admin. Create a User with role
   `agent-editor`.

4. In the `MCP` admin group, create a Payload MCP API key owned by that user. Give it a clear label,
   turn on Payload's API-key field, leave `Enabled` on, set a short expiry, and enable only the tools
   that agent needs. Every custom tool is off by default on a new key. Copy the secret when Payload
   shows it and keep it in the agent's server-side secret store, never browser code.

5. Configure the agent client to use this Streamable HTTP endpoint with the key as a bearer token:

   ```text
   http://localhost:3000/cms/api/mcp
   Authorization: Bearer <key>
   ```

6. Run the real HTTP smoke test while the local app is running:

   ```bash
   npm run test:mcp
   ```

The smoke test creates an isolated agent and scoped key; verifies invalid-key and generic-Payload-auth
rejection, tool scoping, media upload, Post create/update, idempotent replay, admin-approved atomic
bulk commit, trash, and restore; then permanently removes its test data.

## Tool scopes

Enable the smallest useful set on each key:

| Tool                 | Capability                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| `find_content`       | Find compact Page/Post draft records                                   |
| `get_content`        | Read one Page/Post and obtain its `updatedAt` lock token               |
| `create_post_draft`  | Create one validated Post draft                                        |
| `update_post_draft`  | Patch one Post draft                                                   |
| `clone_page_draft`   | Create a Page draft from an existing Page template                     |
| `patch_page_draft`   | Patch allowed Page metadata or bounded copy on existing landing blocks |
| `upload_media`       | Upload one bounded, signature-checked image                            |
| `trash_content`      | Soft-trash a non-published Page or Post                                |
| `restore_content`    | Restore a non-published Page or Post                                   |
| `plan_bulk_drafts`   | Validate and store a bulk draft plan without changing content          |
| `commit_bulk_drafts` | Commit an approved, unexpired bulk plan                                |

A Page copy patch uses `{"copyEdits":[{"blockID":"…","blockType":"heroBanner","patch":{"heading":"New copy"}}]}`.
Supported copy-only blocks are `heroBanner`, `processDiagram`, `statBreak`, `outcomesSection`,
`evolutionBand`, `priceBreak`, `scienceBoard`, `athleteBanner`, `reserveCta`, and `floatingCTA`.
Use the exact block ID and type returned by `get_content`; unsupported fields reject the whole patch.

A sensible first pilot key is read-only (`find_content` and `get_content`). Add individual mutation
tools after the client workflow is understood. Keep `commit_bulk_drafts` disabled until its approval
workflow has been tested by the intended admins.

## Safety controls

- **Draft-only enforcement:** Page/Post mutation calls must save a draft and cannot set a published
  status. Published content in any locale must be unpublished by an admin before trash or restore.
- **Recoverable removal:** agents only set Payload's trash state. Permanent delete remains admin-only.
- **Optimistic locking:** updates, trash, and restore require the exact `updatedAt` returned by the
  last read. A stale operation returns a conflict instead of overwriting newer work.
- **Idempotency:** every mutation has an agent-supplied idempotency key backed by a unique database
  record. Replays return the first successful result; changed input under the same key is rejected.
- **App-level quota:** `MCP_WRITES_PER_MINUTE` limits recent mutations per key owner using shared
  database audit records. The default is 10 and the accepted range is 1–100. A bulk plan and its
  commit each count as one operation; the separate approval gate and 20-item cap bound the batch.
- **Scoped, expiring keys:** admins own key creation, revocation, expiry, and per-tool checkboxes.
  Disabled, expired, ownerless, or non-editor keys are rejected.
- **Bulk review:** plans contain 1–20 operations, are at most 250 KB, expire after 24 hours, and make
  no content changes until an admin sets `Approval Status` to `Approved` in `Agent Operations`.
  Commit uses one database transaction and rolls the whole batch back if any item fails.
- **Media validation:** uploads are base64 decoded, bounded by `MCP_MEDIA_MAX_BYTES` (5 MB by
  default, maximum 25 MB), restricted to four image types, and checked against extension, file
  signature, decoded dimensions, frame count, and `MCP_MEDIA_MAX_PIXELS` (40 million by default).
- **Constrained input:** Post HTML has size/content/link/block validation. Page patches accept only
  title, slug, SEO title/description, and up to 20 typed copy edits on existing supported blocks.
  Copy is converted to plain Lexical text server-side; copy edits cannot change variants, links,
  media, IDs, or order, and raw layout, hero, system, and publish fields are rejected. Bulk plans use
  the same parser and operations.
- **Audit trail:** `Agent Operations` records actor, tool, locale, status, target IDs, and sanitized
  errors. It also stores pending bulk plans. Only admins can browse or change these records.
- **Off switch:** set `MCP_ENABLED=false` and restart the app. Revoking the key is the immediate
  per-agent off switch.

## Existing content compatibility

No Page or Post content conversion is needed for local testing or rollout. The migrations are
additive: they add the role, nullable trash metadata, MCP key/audit structures, and indexes. Existing
Pages, Posts, layouts, rich-text data, locales, and publication states remain in place.

The Page workflow intentionally clones an existing Page because Page layouts contain many typed
blocks. That makes current Pages useful as templates and avoids asking an agent to invent a large,
fragile Payload document from scratch. Existing Posts continue to work unchanged; stricter HTML
parsing applies only when an agent creates or changes API-sourced Post content.

Before a later non-local rollout, take the normal database backup, apply the migrations with MCP
still disabled, verify current admin access and representative content, create the agent/key, then
enable MCP. There is no separate content backfill step.

## Verification commands

```bash
npm run generate:types
npx tsc --noEmit
npm test
npm run build
# With MCP_ENABLED=true and npm run dev running:
npm run test:mcp
```

For an incident, disable or delete the affected key first. If the endpoint itself should stop, set
`MCP_ENABLED=false` and restart. Trashed content can be restored by an admin, and Page/Post version
history remains available for review.
