from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Lesson, Module, Course, Progress, Test, Question, Answer, User
from ..dependencies import get_current_user
from ..utils import is_lesson_locked

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("/{lesson_id}")
async def get_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Lesson).where(Lesson.id == lesson_id).options(
            selectinload(Lesson.test)
        )
    )
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    locked = await is_lesson_locked(db, lesson_id, current_user.id)

    return {
        "id": lesson.id,
        "title": lesson.title,
        "content": lesson.content if not locked else None,
        "video_url": lesson.video_url if not locked else None,
        "sort_order": lesson.sort_order,
        "module_id": lesson.module_id,
        "has_test": lesson.test is not None,
        "locked": locked,
    }


@router.get("/{lesson_id}/test")
async def get_lesson_test(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = lesson_result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if await is_lesson_locked(db, lesson_id, current_user.id):
        raise HTTPException(status_code=403, detail="Previous lesson not passed")

    result = await db.execute(
        select(Test).where(Test.lesson_id == lesson_id).options(
            selectinload(Test.questions).selectinload(Question.answers)
        )
    )
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    questions_out = []
    for q in test.questions:
        answers_out = [{"id": a.id, "text": a.text, "question_id": a.question_id} for a in q.answers]
        questions_out.append({
            "id": q.id,
            "text": q.text,
            "question_type": q.question_type,
            "answers": answers_out,
        })

    return {
        "id": test.id,
        "lesson_id": test.lesson_id,
        "title": test.title,
        "questions": questions_out,
    }
