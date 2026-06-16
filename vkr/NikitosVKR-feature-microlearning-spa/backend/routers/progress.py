from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from datetime import datetime, timezone

from ..database import get_db
from ..models import Progress, Lesson, Test, Question, User
from ..schemas import CheckAnswersRequest
from ..dependencies import get_current_user
from ..config import settings
from ..utils import is_lesson_locked

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("")
async def get_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Progress).where(Progress.user_id == current_user.id)
    )
    records = result.scalars().all()
    return {
        str(p.lesson_id): {"score": p.score, "completed_at": p.completed_at.isoformat()}
        for p in records
    }


@router.post("/check-answers")
async def check_answers(
    data: CheckAnswersRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson_id = data.lesson_id
    user_answers = data.answers

    # Enforce lesson locking on server side
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if await is_lesson_locked(db, lesson_id, current_user.id):
        raise HTTPException(status_code=403, detail="Previous lesson not passed")

    result = await db.execute(
        select(Test).where(Test.lesson_id == lesson_id)
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    from sqlalchemy.orm import selectinload
    result2 = await db.execute(
        select(Test).where(Test.id == test.id).options(
            selectinload(Test.questions).selectinload(Question.answers)
        )
    )
    test = result2.scalar_one()

    total = len(test.questions)
    correct = 0

    for question in test.questions:
        correct_ids = {a.id for a in question.answers if a.is_correct}
        user_ids = set(int(x) for x in user_answers.get(str(question.id), []))
        if correct_ids == user_ids:
            correct += 1

    score = round(correct / total * 100) if total > 0 else 0
    passed = score >= settings.pass_threshold

    if passed:
        now = datetime.now(timezone.utc)
        stmt = insert(Progress).values(
            user_id=current_user.id,
            lesson_id=lesson_id,
            score=score,
            completed_at=now,
        ).on_conflict_do_update(
            index_elements=["user_id", "lesson_id"],
            set_={"score": score, "completed_at": now}
        )
        await db.execute(stmt)
        await db.commit()

    return {"score": score, "passed": passed, "correct": correct, "total": total}
