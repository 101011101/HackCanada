import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backend.api import storage
from app.backend.api.routes import optimize, nodes, coverage, hubs, report, config as config_router, requests as requests_router, ledger as ledger_router, rates as rates_router, engine as engine_router, suggestions as suggestions_router, invite as invite_router
from app.backend.engine import transaction_engine
from app.backend.rate_limit import install_rate_limiting


async def _engine_tick():
    while True:
        await asyncio.sleep(15 * 60)
        farms, crops, hubs_list, config = storage.load_engine_state()
        transaction_engine.run(farms, hubs_list, crops, config)


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage.seed_if_missing()
    asyncio.create_task(_engine_tick())
    yield


app = FastAPI(title='MyCelium API', version='0.1.0', lifespan=lifespan)
install_rate_limiting(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get("/")
def root():
    """Root redirects to API docs so opening 127.0.0.1:8000 in browser works."""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(
        '<!DOCTYPE html><html><head><meta charset="utf-8">'
        '<title>MyCelium API</title></head><body>'
        '<h1>MyCelium API</h1><p>Backend is running.</p>'
        '<p><a href="/docs">Open API docs (Swagger)</a></p>'
        '<p>Use the <strong>frontend</strong> at <a href="http://localhost:5173/">http://localhost:5173</a> '
        '(or 5174, 5175, 5176 if that port is in use).</p></body></html>'
    )

app.include_router(optimize.router)
app.include_router(nodes.router)
app.include_router(coverage.router)
app.include_router(hubs.router)
app.include_router(report.router)
app.include_router(config_router.router)
app.include_router(requests_router.router)
app.include_router(ledger_router.router)
app.include_router(rates_router.router)
app.include_router(engine_router.router)
app.include_router(suggestions_router.router)
app.include_router(invite_router.router)
