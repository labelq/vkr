from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Course, Module, Lesson, Progress, User
from ..schemas import CourseListItem, CourseDetail, CourseCreate, ModuleOut, LessonListItem
from ..dependencies import get_current_user, require_mod
from ..config import settings

router = APIRouter(prefix="/courses", tags=["courses"])


async def get_progress_map(db: AsyncSession, user_id: int) -> dict[int, dict]:
    result = await db.execute(
        select(Progress).where(Progress.user_id == user_id)
    )
    return {
        p.lesson_id: {
            "score": p.score,
            "passed": p.score >= settings.pass_threshold,
            "completed_at": p.completed_at.isoformat(),
        }
        for p in result.scalars()
    }


@router.get("")
async def list_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Course).options(
            selectinload(Course.modules).selectinload(Module.lessons)
        ).order_by(Course.id)
    )
    courses = result.scalars().all()
    progress_map = await get_progress_map(db, current_user.id)

    out = []
    for course in courses:
        lessons = [l for m in course.modules for l in m.lessons]
        completed = sum(1 for l in lessons if l.id in progress_map and progress_map[l.id]["passed"])
        out.append({
            "id": course.id,
            "title": course.title,
            "category": course.category,
            "category_label": course.category_label,
            "color": course.color,
            "description": course.description,
            "is_custom": course.is_custom,
            "lesson_count": len(lessons),
            "completed_count": completed,
        })
    return out


@router.get("/{course_id}")
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Course).where(Course.id == course_id).options(
            selectinload(Course.modules).selectinload(Module.lessons)
        )
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    progress_map = await get_progress_map(db, current_user.id)
    lessons_all = [l for m in course.modules for l in m.lessons]
    completed = sum(1 for l in lessons_all if l.id in progress_map and progress_map[l.id]["passed"])

    modules_out = []
    for m in course.modules:
        lessons_out = [{"id": l.id, "title": l.title, "sort_order": l.sort_order, "module_id": l.module_id} for l in m.lessons]
        modules_out.append({"id": m.id, "title": m.title, "sort_order": m.sort_order, "lessons": lessons_out})

    return {
        "id": course.id,
        "title": course.title,
        "category": course.category,
        "category_label": course.category_label,
        "color": course.color,
        "description": course.description,
        "is_custom": course.is_custom,
        "modules": modules_out,
        "lesson_count": len(lessons_all),
        "completed_count": completed,
        "progress": progress_map,
    }


@router.post("")
async def create_course(
    data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mod),
):
    course = Course(**data.model_dump(), is_custom=True)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mod),
):
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not course.is_custom:
        raise HTTPException(status_code=403, detail="Cannot delete built-in courses")
    await db.delete(course)
    await db.commit()
    return {"ok": True}
