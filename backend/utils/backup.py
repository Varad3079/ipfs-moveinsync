import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

BACKUP_ROOT = Path(__file__).resolve().parent.parent / "backups"


def _ensure_directory(path: Path) -> None:
    """
    Ensure the parent directory exists before writing a backup file.
    """
    path.mkdir(parents=True, exist_ok=True)


def write_snapshot(floor_plan_id: str, snapshot: dict) -> Optional[Path]:
    """
    Persist a snapshot of a floor plan to disk for disaster recovery.
    Returns the path to the written file on success.
    """
    try:
        timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%S")
        directory = BACKUP_ROOT / floor_plan_id
        _ensure_directory(directory)
        file_path = directory / f"{timestamp}.json"
        with open(file_path, "w", encoding="utf-8") as backup_file:
            json.dump(snapshot, backup_file, separators=(",", ":"), ensure_ascii=True)
        return file_path
    except Exception as exc:  # pragma: no cover - defensive guard
        print(f"[BACKUP] Failed to persist snapshot for {floor_plan_id}: {exc}")
        return None


def list_snapshots(floor_plan_id: str) -> list[Path]:
    """
    Returns a list of snapshot file paths (sorted newest first) for a floor plan.
    """
    directory = BACKUP_ROOT / floor_plan_id
    if not directory.exists():
        return []
    snapshots = sorted(directory.glob("*.json"), reverse=True)
    return snapshots


def load_latest_snapshot(floor_plan_id: str) -> Optional[dict[str, Any]]:
    """
    Load the most recent snapshot for a floor plan, if one exists.
    """
    snapshots = list_snapshots(floor_plan_id)
    if not snapshots:
        return None
    latest_file = snapshots[0]
    try:
        with open(latest_file, "r", encoding="utf-8") as backup_file:
            return json.load(backup_file)
    except Exception as exc:  # pragma: no cover - defensive guard
        print(f"[BACKUP] Failed to read snapshot {latest_file}: {exc}")
        return None


