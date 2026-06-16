from __future__ import annotations
from typing import Optional
from fastapi import Depends, HTTPException, Cookie, Header, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .config import settings
from .database import get_db
from .models import User


def create_access_token(data: dict) -> str:
    from datetime import datetime, timedelta, timezone
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    access_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> User:
    token = access_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def require_mod(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Moderator access required")
    return current_user
