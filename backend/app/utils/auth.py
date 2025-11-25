# backend/utils/auth.py

import os
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

AUTH_JWKS_URL = f"{os.getenv('SUPABASE_URL')}/.well-known/jwks.json"
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
JWT_AUDIENCE = "authenticated"
SUPABASE_URL = os.getenv("SUPABASE_URL")
#security = HTTPBearer()
_jwks_cache = None
auth_scheme = HTTPBearer()

async def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                AUTH_JWKS_URL,
                headers={"apikey": SUPABASE_ANON_KEY}  # 🔑 REQUIRED
            )
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache



async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    """Validate token using Supabase Auth API instead of JWKS."""
    
    token = credentials.credentials

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}"
            }
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_data = resp.json()
    
    return {
        "user_id": user_data["id"],
        "email": user_data.get("email")
    }
