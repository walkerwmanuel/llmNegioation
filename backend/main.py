# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.negotiate import router as negotiate_router

app = FastAPI()

# allow your Next.js dev origins explicitly (no "*" when credentials=True)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],   
)

app.include_router(negotiate_router)

@app.get("/")
def root():
    return {"message": "Backend is running"}
