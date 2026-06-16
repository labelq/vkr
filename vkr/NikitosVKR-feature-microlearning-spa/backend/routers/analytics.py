from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models import User, Progress, Ticket, Course, Module, Lesson
from ..dependencies import require_mod

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("")
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mod),
):
    # Total users
    total_users = (await db.execute(select(func.count(User.id)))).scalar()

    # Total completions
    total_completions = (await db.execute(select(func.count(Progress.id)))).scalar()

    # Open tickets
    open_tickets = (await db.execute(
        select(func.count(Ticket.id)).where(Ticket.status == "open")
    )).scalar()

    # Avg score
    avg_score_result = (await db.execute(select(func.avg(Progress.score)))).scalar()
    avg_score = round(float(avg_score_result or 0), 1)

    # Completions by course — single query with GROUP BY
    comp_result = await db.execute(
        select(
            Course.id, Course.title, Course.color,
            func.count(Lesson.id).label("lesson_count"),
            func.count(Progress.id).label("completions"),
        )
        .outerjoin(Module, Module.course_id == Course.id)
        .outerjoin(Lesson, Lesson.module_id == Module.id)
        .outerjoin(Progress, Progress.lesson_id == Lesson.id)
        .group_by(Course.id, Course.title, Course.color)
        .order_by(Course.id)
    )
    completions_by_course = [
        {
            "course_id": row[0],
            "course_title": row[1],
            "color": row[2],
            "lesson_count": row[3],
            "completions": row[4],
        }
        for row in comp_result.all()
    ]

    # Recent completions (last 10)
    recent_result = await db.execute(
        select(Progress, User.name, Lesson.title)
        .join(User, Progress.user_id == User.id)
        .join(Lesson, Progress.lesson_id == Lesson.id)
        .order_by(Progress.completed_at.desc())
        .limit(10)
    )
    recent_completions = [
        {
            "user_name": row[1],
            "lesson_title": row[2],
            "score": row[0].score,
            "completed_at": row[0].completed_at.isoformat(),
        }
        for row in recent_result.all()
    ]

    return {
        "total_users": total_users,
        "total_completions": total_completions,
        "open_tickets": open_tickets,
        "avg_score": avg_score,
        "completions_by_course": completions_by_course,
        "recent_completions": recent_completions,
    }
