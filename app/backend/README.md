# API backend

FastAPI server (see MVP/05-architecture.md). Rate limiting is implemented in `rate_limit.py`.

## Rate limiting

- **Module:** `rate_limit.py` — uses [SlowAPI](https://github.com/laurentS/slowapi) keyed by client IP.
- **Default:** 100 requests per minute per IP. Override per route with `@limiter.limit("20/minute")` (or `"5/second"`, etc.).
- **Install:** `pip install slowapi`
- **Wire up:** Call `install_rate_limiting(app)` after creating your `FastAPI()` app, and add `request: Request` + `@limiter.limit("...")` on endpoints you want to limit.

When a client exceeds the limit, they receive `429 Too Many Requests` and a JSON body like `{"error": "Rate limit exceeded: ..."}`.
