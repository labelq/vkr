from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Lesson, Module, Progress
from .config import settings


async def is_lesson_locked(
    db: AsyncSession,
    lesson_id: int,
    user_id: int,
) -> bool:
    """Check if a lesson is locked (previous lesson not passed)."""
    lesson = await db.get(Lesson, lesson_id)
    if not lesson:
        return True

    mod = await db.get(Module, lesson.module_id)
    if not mod:
        return False

    result = await db.execute(
        select(Lesson).join(Module, Lesson.module_id == Module.id).where(
            Module.course_id == mod.course_id
        ).order_by(Module.sort_order, Lesson.sort_order)
    )
    lessons_list = result.scalars().all()

    for i, l in enumerate(lessons_list):
        if l.id == lesson_id and i > 0:
            prev = lessons_list[i - 1]
            prog = await db.execute(
                select(Progress).where(
                    Progress.user_id == user_id,
                    Progress.lesson_id == prev.id,
                    Progress.score >= settings.pass_threshold,
                )
            )
            return prog.scalar_one_or_none() is None
    return False
