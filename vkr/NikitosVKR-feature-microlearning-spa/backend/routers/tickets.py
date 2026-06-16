from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Ticket, User
from ..schemas import TicketCreate, TicketUpdate
from ..dependencies import get_current_user, require_mod

router = APIRouter(tags=["tickets"])


@router.get("/tickets")
async def get_my_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Ticket).where(Ticket.user_id == current_user.id).order_by(Ticket.created_at.desc())
    )
    tickets = result.scalars().all()
    return [_ticket_out(t) for t in tickets]


@router.post("/tickets")
async def create_ticket(
    data: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = Ticket(user_id=current_user.id, **data.model_dump())
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return _ticket_out(ticket)


@router.get("/admin/tickets")
async def get_all_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mod),
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Ticket).options(selectinload(Ticket.user)).order_by(Ticket.created_at.desc())
    )
    tickets = result.scalars().all()
    return [_ticket_out(t, with_user=True) for t in tickets]


@router.patch("/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_mod),
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if data.status is not None:
        ticket.status = data.status
    if data.response is not None:
        ticket.response = data.response

    await db.commit()
    await db.refresh(ticket)
    return _ticket_out(ticket)


def _ticket_out(t: Ticket, with_user: bool = False) -> dict:
    d = {
        "id": t.id,
        "user_id": t.user_id,
        "title": t.title,
        "message": t.message,
        "status": t.status,
        "response": t.response,
        "created_at": t.created_at.isoformat(),
    }
    if with_user and hasattr(t, "user") and t.user:
        d["user_name"] = t.user.name
    return d
