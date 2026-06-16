from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
import asyncio

from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, RegisterRequest, Token, UserOut
from ..dependencies import create_access_token, get_current_user
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def verify_password(plain: str, hashed: str) -> bool:
    return await asyncio.to_thread(pwd_context.verify, plain, hashed)


async def hash_password(plain: str) -> str:
    return await asyncio.to_thread(pwd_context.hash, plain)


@router.post("/login")
async def login(data: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not await verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    response.set_cookie(
        key="access_token", value=token,
        httponly=True, samesite="lax", secure=settings.cookie_secure, path="/",
        max_age=60 * 60 * 24,
    )
    return {"access_token": token, "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.post("/register")
async def register(data: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = await hash_password(data.password)
    user = User(name=data.name, email=data.email, password_hash=hashed)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    response.set_cookie(
        key="access_token", value=token,
        httponly=True, samesite="lax", secure=settings.cookie_secure, path="/",
        max_age=60 * 60 * 24,
    )
    return {"access_token": token, "token_type": "bearer", "user": UserOut.model_validate(user)}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}
