from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ---- Auth ----

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---- Answers ----

class AnswerOut(BaseModel):
    id: int
    text: str
    question_id: int

    model_config = {"from_attributes": True}


class AnswerOutWithCorrect(AnswerOut):
    is_correct: bool


# ---- Questions ----

class QuestionOut(BaseModel):
    id: int
    text: str
    question_type: str
    answers: list[AnswerOut]

    model_config = {"from_attributes": True}


# ---- Tests ----

class TestOut(BaseModel):
    id: int
    lesson_id: int
    title: str
    questions: list[QuestionOut]

    model_config = {"from_attributes": True}


# ---- Progress ----

class CheckAnswersRequest(BaseModel):
    lesson_id: int
    answers: dict[str, list[str]]


class ProgressOut(BaseModel):
    lesson_id: int
    score: int
    completed_at: datetime

    model_config = {"from_attributes": True}


# ---- Lessons ----

class LessonBase(BaseModel):
    id: int
    title: str
    sort_order: int
    module_id: int

    model_config = {"from_attributes": True}


class LessonOut(LessonBase):
    content: Optional[str]
    video_url: Optional[str]
    has_test: bool


class LessonListItem(LessonBase):
    pass


# ---- Modules ----

class ModuleOut(BaseModel):
    id: int
    title: str
    sort_order: int
    lessons: list[LessonListItem]

    model_config = {"from_attributes": True}


# ---- Admin Content ----

class ModuleCreate(BaseModel):
    course_id: int
    title: str
    sort_order: int | None = None

class ModuleUpdate(BaseModel):
    title: str | None = None
    sort_order: int | None = None

class LessonCreate(BaseModel):
    module_id: int
    title: str
    content: str | None = None
    video_url: str | None = None
    sort_order: int | None = None

class LessonUpdate(BaseModel):
    module_id: int | None = None
    title: str | None = None
    content: str | None = None
    video_url: str | None = None
    sort_order: int | None = None

class TestCreate(BaseModel):
    lesson_id: int
    title: str

class TestUpdate(BaseModel):
    title: str | None = None

class QuestionCreate(BaseModel):
    test_id: int
    text: str
    question_type: str = "single"

class QuestionUpdate(BaseModel):
    text: str | None = None
    question_type: str | None = None

class AnswerCreate(BaseModel):
    question_id: int
    text: str
    is_correct: bool = False

class AnswerUpdate(BaseModel):
    text: str | None = None
    is_correct: bool | None = None


# ---- Courses ----

class CourseListItem(BaseModel):
    id: int
    title: str
    category: str
    category_label: str
    color: str
    description: Optional[str]
    is_custom: bool
    lesson_count: int
    completed_count: int

    model_config = {"from_attributes": True}


class CourseDetail(BaseModel):
    id: int
    title: str
    category: str
    category_label: str
    color: str
    description: Optional[str]
    is_custom: bool
    modules: list[ModuleOut]
    lesson_count: int
    completed_count: int

    model_config = {"from_attributes": True}


class CourseCreate(BaseModel):
    title: str
    category: str
    category_label: str
    color: str = "#2563eb"
    description: Optional[str] = None


# ---- Tickets ----

class TicketCreate(BaseModel):
    title: str
    message: str


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    response: Optional[str] = None


class TicketOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    status: str
    response: Optional[str]
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ---- FAQ ----

class FaqCreate(BaseModel):
    category: str
    title: str
    content: str


class FaqOut(BaseModel):
    id: int
    category: str
    title: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Users ----

class UserRoleUpdate(BaseModel):
    role: str


# ---- Analytics ----

class AnalyticsOut(BaseModel):
    total_users: int
    total_completions: int
    open_tickets: int
    avg_score: float
    completions_by_course: list[dict]
    recent_completions: list[dict]
