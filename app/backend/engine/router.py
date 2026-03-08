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
