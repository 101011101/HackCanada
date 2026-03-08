from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import storage
from app.api.routes import optimize, nodes, coverage, hubs, report, config as config_router, requests as requests_router, ledger as ledger_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    storage.seed_if_missing()
    yield


app = FastAPI(title='MyCelium API', version='0.1.0', lifespan=lifespan)

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
