# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.routes import router as api_router


app = FastAPI(
    title="Document Refinement Backend",
    version="1.0.0",
    description="Backend API for generating and refining document content using LLMs."
)

# ---------------------------------------------------------
# CORS — allow your React frontend to call this API
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # change to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Routers
# ---------------------------------------------------------
app.include_router(api_router, prefix="/api")


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Backend is running!"}
