from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import User
from ..schemas import UserOut, UserRoleUpdate
from ..dependencies import get_current_user, require_mod, require_admin

router = APIRouter(prefix="/users", tags=["users"])

VALID_ROLES = {"user", "moderator", "admin"}


@router.get("", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mod),
):
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_role(
    user_id: int,
    data: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return user
