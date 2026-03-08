"""
Cache layer for AI-generated tasks.
Mirrors the _load/_save pattern from storage.py.
Cache key format: "{farm_id}_{crop_id}_{cycle_number}"
"""
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / 'data'
_CACHE_FILE = 'ai_tasks.json'


def load_ai_tasks() -> dict:
    path = DATA_DIR / _CACHE_FILE
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        return {}


def save_ai_tasks(cache: dict) -> None:
    DATA_DIR.mkdir(exist_ok=True)
    (DATA_DIR / _CACHE_FILE).write_text(json.dumps(cache, indent=2))


def _key(farm_id: int, crop_id: int, cycle_number: int) -> str:
    return f"{farm_id}_{crop_id}_{cycle_number}"


def get_cached_tasks(farm_id: int, crop_id: int, cycle_number: int) -> list[dict] | None:
    cache = load_ai_tasks()
    return cache.get(_key(farm_id, crop_id, cycle_number))


def set_cached_tasks(farm_id: int, crop_id: int, cycle_number: int, tasks: list[dict]) -> None:
    cache = load_ai_tasks()
    cache[_key(farm_id, crop_id, cycle_number)] = tasks
    save_ai_tasks(cache)


def invalidate_farm_tasks(farm_id: int) -> None:
    prefix = f"{farm_id}_"
    cache  = load_ai_tasks()
    keys_to_remove = [k for k in cache if k.startswith(prefix)]
    if not keys_to_remove:
        return
    for k in keys_to_remove:
        del cache[k]
    save_ai_tasks(cache)
