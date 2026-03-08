import math
import numpy as np
from .schemas import FarmNode, HubNode


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Returns great-circle distance in metres between two GPS coordinates."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi       = math.radians(lat2 - lat1)
    dlambda    = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def compute_hub_routing(farms: list, hubs: list, max_distance: float) -> dict:
    """
    Returns {farm.id: [hub.id, ...]} ordered by distance ascending.
    The nearest hub is always first (primary). Additional hubs are included only if
    within max_distance. Fallback: if no hub qualifies, the nearest hub is used alone.
    """
    result = {}
    for farm in farms:
        # Per-farm radius: respect user preference but never exceed network max
        farm_max = getattr(farm, 'max_delivery_distance_m', None)
        effective_max = min(farm_max, max_distance) if farm_max is not None else max_distance

        candidates = []
        nearest = (float('inf'), None)
        for hub in hubs:
            d = haversine(farm.lat, farm.lng, hub.lat, hub.lng)
            if d < nearest[0]:
                nearest = (d, hub.id)
            if d <= effective_max:
                candidates.append((d, hub.id))
        if candidates:
            candidates.sort()
            result[farm.id] = [hub_id for _, hub_id in candidates]
        else:
            # Fallback: nearest hub regardless of distance preference
            result[farm.id] = [nearest[1]] if nearest[1] is not None else []
    return result


def build_reachability_matrix(farms: list, hubs: list, max_distance: float) -> np.ndarray:
    """
    Returns bool array of shape [N, H].
    reachability_matrix[i][h] = True if farm i is within max_distance metres of hub h.
    """
    N, H = len(farms), len(hubs)
    matrix = np.zeros((N, H), dtype=bool)
    for i, farm in enumerate(farms):
        for h, hub in enumerate(hubs):
            dist = haversine(farm.lat, farm.lng, hub.lat, hub.lng)
            matrix[i][h] = dist <= max_distance
    return matrix
