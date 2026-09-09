import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, demo, disruptions, itinerary, ledger, operator, payments, recovery, trips
from app.config import settings

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=1.0)

app = FastAPI(title="YatraOS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the deployed frontend origin before Phase 5
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(itinerary.router)
app.include_router(disruptions.router)
app.include_router(recovery.router)
app.include_router(ledger.router)
app.include_router(payments.router)
app.include_router(operator.router)
app.include_router(demo.router)


@app.get("/health")
def health():
    return {"status": "ok"}
