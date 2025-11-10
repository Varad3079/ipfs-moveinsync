# Intelligent Floor Plan Management System – Implementation Notes

## Authentication
- FastAPI dependency stack enforces role-based access control for admin and user flows.
- WebSocket connections are gated through JWT validation, preventing cross-tenant access.

```24:91:backend/utils/security.py
async def get_websocket_admin_user(
    current_user: User = Depends(get_websocket_user)
) -> User:
    if current_user.role != ADMIN_ROLE:
        raise WebSocketDisconnect(code=status.WS_1008_POLICY_VIOLATION, reason="Administrator privileges required")
```

## Time & Space Complexity Overview
- `GET /admin/floorplans`: single company query, `O(n)` with respect to number of floor plans; caching pushes steady-state lookup to `O(1)` time, `O(n)` space in Redis.
- Conflict-aware `update_floor_plan_and_resolve_conflict`: iterates once through submitted rooms, `O(r)` where `r` is the number of updates; room snapshots are stored as JSON (bounded by room count) resulting in `O(r)` space per version.
- Room recommendations: availability scan `O(m)` (rooms), preference join `O(p)`, final sort `O(m log m)`; data is tenant-scoped, so `m` remains small.

## Fault Tolerance, Backup, & Recovery
- Database commits are retried up to three times with linear backoff, handling transient failures.
- Every floor plan write captures an immutable version entry and persists a JSON snapshot on disk for quick recovery.
- Admins can restore the latest backup from the UI; the action replays the stored snapshot and broadcasts a live update to clients.

```60:120:backend/controllers/floorplan_service.py
with_retry(db.commit)
...
write_snapshot(str(fp_to_update.id), snapshot_data)
```

## Conflict Resolution Strategy
- Incoming admin updates compare their role priority to the last editor’s role.
- Higher or equal priority updates override in-place; otherwise, the request is rejected with a descriptive error.
- Resolved conflicts tag the saved snapshot with contextual metadata for audit trails.

```1:62:backend/utils/conflict_resolver.py
def should_override(...):
    if incoming_priority >= previous_priority:
        return ConflictResolutionResult(allow_override=True, reason="Incoming change applied...")
```

## Trade-offs & Rationale
- **Caching TTL vs. Active Invalidation**: opted for one-hour TTL with targeted invalidation to balance Redis utilization against implementation complexity.
- **Snapshot-on-write vs. streaming backups**: local JSON backups are simple and deterministic; suitable for the current deployments without requiring external storage.
- **Lightweight Monitoring**: custom in-memory metrics avoid the operational overhead of Prometheus while still exposing essential latencies and error counts.
- **Room Recommendation Heuristics**: proximity scoring uses the last booked room as the anchor—good enough for suggesting familiar rooms without a full pathfinding model.

## System Monitoring
- Unified middleware records request latency, error counts, and exposes metrics at `/api/v1/system/metrics` for dashboard integration.

```37:65:backend/app.py
@app.get(f"{API_V1_STR}/system/metrics")
def system_metrics():
    return {"metrics": to_dict()}
```

## Caching
- Redis front-loads floor plan queries, while explicit invalidation keeps stale data out after updates or restores.

## Error & Exception Handling
- API routes wrap domain errors in typed HTTP responses and roll back database sessions on failure.
- Critical operations (conflict overrides, backup writes, WebSocket fan-out) include guard rails with diagnostic logging.

## Submission Deliverables
- **Screenshots**: drop PNG files into `docs/screenshots/` (e.g. `admin-dashboard.png`, `user-booking.png`).
- **Demonstration Video**: export a short walkthrough to `docs/demo/demo.mp4` highlighting authentication, conflict resolution, offline sync, and backup restore.
- **Code Snippets**: reference this document for curated excerpts tied to each requirement.

