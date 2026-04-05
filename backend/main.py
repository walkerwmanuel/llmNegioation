# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes.negotiate import router as negotiate_router
from routes.speechtotext import router as speech_router
from routes.auth_routes import router as auth_router
from routes.negotiation_routes import router as negotiation_router
from routes.message_routes import router as message_router
from routes.realtime import router as realtime_router
from database.db import init_db
from routes.emotion_routes import router as emotion_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    init_db()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(lifespan=lifespan)
app.include_router(emotion_router)

# Allow frontend origins for CORS
origins = [
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(negotiate_router)
app.include_router(speech_router)
app.include_router(auth_router)
app.include_router(negotiation_router)
app.include_router(message_router)
app.include_router(realtime_router)



@app.get("/")
def root():
    return {"message": "Backend is running"}
