from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Course, Module, Lesson, Test, Question, Answer, User
from ..schemas import (
    ModuleCreate, ModuleUpdate,
    LessonCreate, LessonUpdate,
    TestCreate, TestUpdate,
    QuestionCreate, QuestionUpdate,
    AnswerCreate, AnswerUpdate,
)
from ..dependencies import require_mod

router = APIRouter(prefix="/admin", tags=["admin-content"])


async def _check_exists(db: AsyncSession, model, id: int, name: str):
    obj = await db.get(model, id)
    if not obj:
        raise HTTPException(status_code=404, detail=f"{name} not found")


# ── Modules ─────────────────────────────────────────────────


@router.get("/courses/{course_id}/modules")
async def list_modules(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(
        select(Module).where(Module.course_id == course_id).order_by(Module.sort_order)
    )
    return result.scalars().all()


@router.post("/modules")
async def create_module(
    data: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    await _check_exists(db, Course, data.course_id, "Course")
    if data.sort_order is None:
        result = await db.execute(
            select(Module).where(Module.course_id == data.course_id).order_by(Module.sort_order.desc()).limit(1)
        )
        last = result.scalar_one_or_none()
        sort_order = (last.sort_order + 1) if last else 1
    else:
        sort_order = data.sort_order

    mod = Module(course_id=data.course_id, title=data.title, sort_order=sort_order)
    db.add(mod)
    await db.commit()
    await db.refresh(mod)
    return mod


@router.put("/modules/{module_id}")
async def update_module(
    module_id: int,
    data: ModuleUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Module).where(Module.id == module_id))
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    if data.title is not None:
        mod.title = data.title
    if data.sort_order is not None:
        mod.sort_order = data.sort_order
    await db.commit()
    await db.refresh(mod)
    return mod


@router.delete("/modules/{module_id}")
async def delete_module(
    module_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Module).where(Module.id == module_id))
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    await db.delete(mod)
    await db.commit()
    return {"ok": True}


# ── Lessons ─────────────────────────────────────────────────


@router.post("/lessons")
async def create_lesson(
    data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    await _check_exists(db, Module, data.module_id, "Module")
    if data.sort_order is None:
        result = await db.execute(
            select(Lesson).where(Lesson.module_id == data.module_id).order_by(Lesson.sort_order.desc()).limit(1)
        )
        last = result.scalar_one_or_none()
        sort_order = (last.sort_order + 1) if last else 1
    else:
        sort_order = data.sort_order

    lesson = Lesson(
        module_id=data.module_id,
        title=data.title,
        content=data.content,
        video_url=data.video_url,
        sort_order=sort_order,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.put("/lessons/{lesson_id}")
async def update_lesson(
    lesson_id: int,
    data: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if data.module_id is not None:
        await _check_exists(db, Module, data.module_id, "Module")
        lesson.module_id = data.module_id
    if data.title is not None:
        lesson.title = data.title
    if data.content is not None:
        lesson.content = data.content
    if data.video_url is not None:
        lesson.video_url = data.video_url
    if data.sort_order is not None:
        lesson.sort_order = data.sort_order
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalar_one_or_none()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    await db.delete(lesson)
    await db.commit()
    return {"ok": True}


# ── Tests ────────────────────────────────────────────────────


@router.get("/lessons/{lesson_id}/test")
async def get_lesson_test(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Test).where(Test.lesson_id == lesson_id))
    test = result.scalar_one_or_none()
    if not test:
        return None

    from sqlalchemy.orm import selectinload
    result2 = await db.execute(
        select(Test).where(Test.id == test.id).options(
            selectinload(Test.questions).selectinload(Question.answers)
        )
    )
    test = result2.scalar_one()
    return {
        "id": test.id,
        "lesson_id": test.lesson_id,
        "title": test.title,
        "questions": [
            {
                "id": q.id,
                "text": q.text,
                "question_type": q.question_type,
                "answers": [
                    {"id": a.id, "text": a.text, "question_id": a.question_id, "is_correct": a.is_correct}
                    for a in q.answers
                ],
            }
            for q in test.questions
        ],
    }


@router.post("/tests")
async def create_test(
    data: TestCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    await _check_exists(db, Lesson, data.lesson_id, "Lesson")
    test = Test(lesson_id=data.lesson_id, title=data.title)
    db.add(test)
    await db.commit()
    await db.refresh(test)
    return test


@router.put("/tests/{test_id}")
async def update_test(
    test_id: int,
    data: TestUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    if data.title is not None:
        test.title = data.title
    await db.commit()
    await db.refresh(test)
    return test


@router.delete("/tests/{test_id}")
async def delete_test(
    test_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Test).where(Test.id == test_id))
    test = result.scalar_one_or_none()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    await db.delete(test)
    await db.commit()
    return {"ok": True}


# ── Questions ────────────────────────────────────────────────


@router.post("/questions")
async def create_question(
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    await _check_exists(db, Test, data.test_id, "Test")
    q = Question(test_id=data.test_id, text=data.text, question_type=data.question_type)
    db.add(q)
    await db.commit()
    await db.refresh(q)
    return q


@router.put("/questions/{question_id}")
async def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    if data.text is not None:
        q.text = data.text
    if data.question_type is not None:
        q.question_type = data.question_type
    await db.commit()
    await db.refresh(q)
    return q


@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(q)
    await db.commit()
    return {"ok": True}


# ── Answers ──────────────────────────────────────────────────


@router.post("/answers")
async def create_answer(
    data: AnswerCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    await _check_exists(db, Question, data.question_id, "Question")
    a = Answer(question_id=data.question_id, text=data.text, is_correct=data.is_correct)
    db.add(a)
    await db.commit()
    await db.refresh(a)
    return a


@router.put("/answers/{answer_id}")
async def update_answer(
    answer_id: int,
    data: AnswerUpdate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Answer).where(Answer.id == answer_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Answer not found")
    if data.text is not None:
        a.text = data.text
    if data.is_correct is not None:
        a.is_correct = data.is_correct
    await db.commit()
    await db.refresh(a)
    return a


@router.delete("/answers/{answer_id}")
async def delete_answer(
    answer_id: int,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_mod),
):
    result = await db.execute(select(Answer).where(Answer.id == answer_id))
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Answer not found")
    await db.delete(a)
    await db.commit()
    return {"ok": True}
