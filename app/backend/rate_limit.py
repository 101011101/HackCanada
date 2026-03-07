"""
Rate limiting for the API server (FastAPI).

Usage:
    pip install slowapi
    Then in your FastAPI app:

    from rate_limit import limiter, install_rate_limiting  # or app.backend.rate_limit

    app = FastAPI()
    install_rate_limiting(app)

    @app.get("/nodes")
    @limiter.limit("60/minute")
    async def get_nodes(request: Request):
        ...
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Limit by client IP. Use default_limits to set a global cap.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],  # per-route override with @limiter.limit("N/minute")
)


def install_rate_limiting(app):
    """Attach the limiter to the FastAPI app and handle exceeded errors."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
