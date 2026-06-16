from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import FaqArticle, User
from ..schemas import FaqCreate, FaqOut
from ..dependencies import get_current_user, require_mod

router = APIRouter(prefix="/faq", tags=["faq"])


@router.get("")
async def get_faq(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(FaqArticle).order_by(FaqArticle.id))
    return result.scalars().all()


@router.post("")
async def create_faq(
    data: FaqCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mod),
):
    article = FaqArticle(**data.model_dump())
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return article


@router.delete("/{faq_id}")
async def delete_faq(
    faq_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mod),
):
    result = await db.execute(select(FaqArticle).where(FaqArticle.id == faq_id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="FAQ article not found")
    await db.delete(article)
    await db.commit()
    return {"ok": True}
