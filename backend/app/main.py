from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix=settings.api_v1_prefix)


@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
def health() -> dict[str, str]:
    """Lightweight check for load balancers (GET and HEAD)."""
    return {"status": "ok"}


@app.get("/")
@app.head("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"message": "Language Study API — see /docs for interactive API docs"}
