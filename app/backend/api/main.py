import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.backend.api import storage
from app.backend.api.routes import optimize, nodes, coverage, hubs, report, config as config_router, requests as requests_router, ledger as ledger_router, rates as rates_router, engine as engine_router, suggestions as suggestions_router
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
    allow_origins=[
        'http://localhost:3000', 'http://127.0.0.1:3000',
        'http://localhost:8080', 'http://127.0.0.1:8080',
        'null',  # file:// origin
    ],
    allow_methods=['*'],
    allow_headers=['*'],
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
