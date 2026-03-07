from fastapi import APIRouter

from app.api import storage

router = APIRouter()


@router.get('/hubs')
def get_hubs():
    """All hub nodes with location + capacity."""
    return storage.load_hubs()


@router.get('/crops')
def get_crops():
    """All crop definitions (id, name, grow_weeks, color, etc.)."""
    return storage.load_crops()
