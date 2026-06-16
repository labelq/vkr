from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, courses, lessons, progress, tickets, faq, users, analytics, admin_content
from .config import settings

app = FastAPI(title="ПУЦ Микрообучение API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(tickets.router, prefix="/api")
app.include_router(faq.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(admin_content.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
