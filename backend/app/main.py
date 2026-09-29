from contextlib import asynccontextmanager
from pathlib import Path

import jwt
from fastapi import Body, Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .db import get_db, init_db
from .max_auth import validate_max_init_data
from .max_client import max_client
from .models import (
    Building,
    BuildingEvent,
    Meter,
    MiniAppRegistration,
    News,
    Notification,
    Request,
    RequestParticipant,
    ResidentBuilding,
    ResidentBuildingMeta,
    Subscription,
    User,
)
from .schemas import (
    BuildingCreate,
    DemoLogin,
    EventResolve,
    HousePostCreate,
    HouseJoin,
    JoinBuilding,
    MaxInitData,
    MaxRegistration,
    MeterSubmit,
    NewsCreate,
    RequestCreate,
    RequestStatus,
    RequestUpdate,
    SubscriptionCreate,
)
from .services.house_service import (
    building_to_house_payload,
    catalog_payload,
    my_houses_payload,
)


@asynccontextmanager
async def lifespan(app):
    await init_db()
    yield


app = FastAPI(title="Мой Дом API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def make_token(user: User):
    return jwt.encode(
        {"sub": str(user.id), "role": user.role},
        settings.jwt_secret,
        algorithm="HS256",
    )


async def current_user(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authorization required")

    try:
        payload = jwt.decode(
            authorization[7:],
            settings.jwt_secret,
            algorithms=["HS256"],
        )
        uid = int(payload["sub"])
    except Exception as exc:
        raise HTTPException(401, "Invalid token") from exc

    user = await db.get(User, uid)
    if not user:
        raise HTTPException(401, "User not found")

    return user


async def ensure_resident_has_house(
    db: AsyncSession,
    user_id: int,
    building_id: int,
) -> ResidentBuilding:
    result = await db.execute(
        select(ResidentBuilding).where(
            ResidentBuilding.user_id == user_id,
            ResidentBuilding.building_id == building_id,
        )
    )
    link = result.scalars().first()
    if not link:
        raise HTTPException(403, "This house is not connected to the resident")
    return link


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}


@app.post("/api/auth/demo")
async def demo_login(
    data: DemoLogin,
    db: AsyncSession = Depends(get_db),
):
    # Для демо не плодим нового пользователя на каждый refresh.
    result = await db.execute(
        select(User).where(
            User.first_name == data.first_name,
            User.last_name == data.last_name,
            User.role == data.role,
        )
    )
    user = result.scalars().first()

    if not user:
        user = User(
            first_name=data.first_name,
            last_name=data.last_name,
            role=data.role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return {
        "access_token": make_token(user),
        "user": user_to_dict(user),
    }


@app.post("/api/auth/max")
async def max_login(
    init_data: str = Body(...),
    db: AsyncSession = Depends(get_db),
):
    max_user = validate_max_init_data(init_data)

    if not max_user:
        raise HTTPException(
            401,
            "Invalid MAX initData. For local demo use /api/auth/demo.",
        )

    max_id = str(max_user["id"])
    result = await db.execute(
        select(User).where(User.max_user_id == max_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            max_user_id=max_id,
            first_name=max_user.get("first_name", ""),
            last_name=max_user.get("last_name", ""),
            role="resident",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return {
        "access_token": make_token(user),
        "user": user_to_dict(user),
    }


@app.post("/api/auth/max/status")
async def max_registration_status(
    data: MaxInitData,
    db: AsyncSession = Depends(get_db),
):
    max_user = validate_max_init_data(data.init_data)
    if not max_user:
        raise HTTPException(401, "Invalid MAX initData")

    max_id = str(max_user["id"])
    registration = await db.scalar(
        select(MiniAppRegistration).where(
            MiniAppRegistration.max_user_id == max_id
        )
    )
    if registration is None:
        return {"registered": False}

    user = await db.get(User, registration.user_id)
    if user is None:
        return {"registered": False}

    return {
        "registered": True,
        "access_token": make_token(user),
        "user": user_to_dict(user),
    }


@app.post("/api/auth/max/register")
async def register_max_user(
    data: MaxRegistration,
    db: AsyncSession = Depends(get_db),
):
    max_user = validate_max_init_data(data.init_data)
    if not max_user:
        raise HTTPException(401, "Invalid MAX initData")

    first_name = data.first_name.strip()
    last_name = data.last_name.strip()
    if not first_name or not last_name:
        raise HTTPException(422, "First name and last name are required")

    max_id = str(max_user["id"])
    registration = await db.scalar(
        select(MiniAppRegistration).where(
            MiniAppRegistration.max_user_id == max_id
        )
    )

    if registration is not None:
        user = await db.get(User, registration.user_id)
        if user is None:
            raise HTTPException(409, "Registration account is unavailable")
        registration.phone = data.phone.strip()
        registration.auth_provider = data.auth_provider
    else:
        user = await db.scalar(select(User).where(User.max_user_id == max_id))
        if user is None:
            user = User(
                max_user_id=max_id,
                first_name=first_name,
                last_name=last_name,
                role="resident",
            )
            db.add(user)
            await db.flush()

        registration = MiniAppRegistration(
            max_user_id=max_id,
            user_id=user.id,
            phone=data.phone.strip(),
            auth_provider=data.auth_provider,
        )
        db.add(registration)

    user.first_name = first_name
    user.last_name = last_name
    user.role = "resident"
    user.max_user_id = max_id

    # Формальный сценарий сразу подключает три демонстрационных дома.
    default_addresses = (
        "ул. Пушкина, 7",
        "проспект Мира, 24",
        "ул. Ленина, 18",
    )
    buildings = list(
        (
            await db.scalars(
                select(Building).where(Building.address.in_(default_addresses))
            )
        ).all()
    )
    apartments = {
        "ул. Пушкина, 7": "45",
        "проспект Мира, 24": "8",
        "ул. Ленина, 18": "12",
    }
    for building in buildings:
        link = await db.scalar(
            select(ResidentBuilding).where(
                ResidentBuilding.user_id == user.id,
                ResidentBuilding.building_id == building.id,
            )
        )
        if link is None:
            db.add(
                ResidentBuilding(
                    user_id=user.id,
                    building_id=building.id,
                    apartment_number=apartments[building.address],
                    verified=True,
                )
            )

        meta = await db.scalar(
            select(ResidentBuildingMeta).where(
                ResidentBuildingMeta.user_id == user.id,
                ResidentBuildingMeta.building_id == building.id,
            )
        )
        if meta is None:
            db.add(
                ResidentBuildingMeta(
                    user_id=user.id,
                    building_id=building.id,
                    relation="owner",
                )
            )

    await db.commit()
    await db.refresh(user)
    return {
        "registered": True,
        "access_token": make_token(user),
        "user": user_to_dict(user),
    }


@app.get("/api/auth/me")
async def me(user: User = Depends(current_user)):
    return user_to_dict(user)


# ---------------------------------------------------------------------------
# Новый домо-центричный API
# ---------------------------------------------------------------------------

@app.get("/api/houses/catalog")
async def houses_catalog(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    return await catalog_payload(db, user.id)


@app.get("/api/houses/my")
async def my_houses(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "resident":
        # Для управляющей компании можно вернуть каталог её домов.
        return await catalog_payload(db, None)

    return await my_houses_payload(db, user.id)


@app.get("/api/houses/{building_id}")
async def house_detail(
    building_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    building = await db.get(Building, building_id)
    if not building:
        raise HTTPException(404, "House not found")

    if user.role == "resident":
        await ensure_resident_has_house(db, user.id, building_id)

    return await building_to_house_payload(
        db,
        building,
        user.id if user.role == "resident" else None,
    )


@app.post("/api/houses/{building_id}/join")
async def join_house(
    building_id: int,
    data: HouseJoin,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "resident":
        raise HTTPException(403, "Only resident can join a house")

    building = await db.get(Building, building_id)
    if not building:
        raise HTTPException(404, "House not found")

    result = await db.execute(
        select(ResidentBuilding).where(
            ResidentBuilding.user_id == user.id,
            ResidentBuilding.building_id == building_id,
        )
    )
    link = result.scalars().first()

    if not link:
        link = ResidentBuilding(
            user_id=user.id,
            building_id=building_id,
            apartment_number=data.apartment_number,
            verified=False,
        )
        db.add(link)
    else:
        link.apartment_number = data.apartment_number

    meta_result = await db.execute(
        select(ResidentBuildingMeta).where(
            ResidentBuildingMeta.user_id == user.id,
            ResidentBuildingMeta.building_id == building_id,
        )
    )
    meta = meta_result.scalars().first()

    if not meta:
        meta = ResidentBuildingMeta(
            user_id=user.id,
            building_id=building_id,
            relation=data.relation,
        )
        db.add(meta)
    else:
        meta.relation = data.relation

    await db.commit()

    return await building_to_house_payload(db, building, user.id)


@app.delete("/api/houses/{building_id}/membership")
async def remove_house_membership(
    building_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "resident":
        raise HTTPException(403, "Only resident can remove a house")

    link = await ensure_resident_has_house(db, user.id, building_id)
    meta_result = await db.execute(
        select(ResidentBuildingMeta).where(
            ResidentBuildingMeta.user_id == user.id,
            ResidentBuildingMeta.building_id == building_id,
        )
    )
    meta = meta_result.scalars().first()

    if meta:
        await db.delete(meta)
    await db.delete(link)
    await db.commit()

    return {"ok": True}


@app.get("/api/houses/{building_id}/requests")
async def house_requests(
    building_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role == "resident":
        await ensure_resident_has_house(db, user.id, building_id)

    result = await db.execute(
        select(Request)
        .where(Request.building_id == building_id)
        .order_by(Request.id.desc())
    )
    rows = list(result.scalars().all())

    return [
        {
            "id": row.id,
            "buildingId": row.building_id,
            "category": row.category,
            "description": row.description,
            "status": row.status,
            "createdAt": row.created_at.isoformat(),
            "residents": 1,
            "isMine": row.resident_id == user.id,
        }
        for row in rows
    ]


@app.post("/api/houses/{building_id}/meters/{meter_id}/submit")
async def submit_meter(
    building_id: int,
    meter_id: int,
    data: MeterSubmit,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "resident":
        raise HTTPException(403, "Only resident can submit meter values")

    await ensure_resident_has_house(db, user.id, building_id)

    meter = await db.get(Meter, meter_id)
    if not meter or meter.building_id != building_id:
        raise HTTPException(404, "Meter not found")

    from datetime import datetime, timezone

    meter.last_value = data.value.strip()
    meter.last_submitted_at = datetime.now(timezone.utc)
    meter.submission_required = False

    await db.commit()

    building = await db.get(Building, building_id)
    return await building_to_house_payload(db, building, user.id)


@app.patch("/api/houses/{building_id}/events/{event_id}")
async def update_house_event(
    building_id: int,
    event_id: int,
    data: EventResolve,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role == "resident":
        await ensure_resident_has_house(db, user.id, building_id)
    elif user.role not in ("manager", "management_company", "admin"):
        raise HTTPException(403, "Management role required")

    event = await db.get(BuildingEvent, event_id)
    if not event or event.building_id != building_id:
        raise HTTPException(404, "Event not found")

    event.resolved = data.resolved
    await db.commit()

    building = await db.get(Building, building_id)
    return await building_to_house_payload(
        db,
        building,
        user.id if user.role == "resident" else None,
    )


@app.post("/api/houses/{building_id}/posts")
async def create_house_post(
    building_id: int,
    data: HousePostCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    """Прототип публикации УК с рассылкой жителям дома в MAX."""
    building = await db.get(Building, building_id)
    if not building:
        raise HTTPException(404, "Building not found")

    if user.role == "resident":
        # В демо житель может открыть прототип кабинета УК только для своего дома.
        await ensure_resident_has_house(db, user.id, building_id)
    elif user.role not in ("manager", "management_company", "admin"):
        raise HTTPException(403, "Management role required")

    title = data.title.strip()
    body = data.body.strip()
    if len(title) < 3 or len(body) < 10:
        raise HTTPException(400, "Title or post text is too short")

    allowed_types = {"announcement", "work", "good", "useful"}
    event_type = data.post_type if data.post_type in allowed_types else "announcement"
    event = BuildingEvent(
        building_id=building_id,
        event_type=event_type,
        severity="attention" if data.important else "info",
        title=title,
        body=body,
        date_label="Сегодня",
        icon="!" if data.important else "▤",
        requires_attention=data.important,
        resolved=False,
    )
    db.add(event)
    await db.flush()

    resident_rows = await db.execute(
        select(ResidentBuilding).where(
            ResidentBuilding.building_id == building_id
        )
    )
    resident_ids = {row.user_id for row in resident_rows.scalars().all()}
    max_sent = 0
    max_failed = 0

    for resident_id in resident_ids:
        notification = Notification(
            user_id=resident_id,
            title=title,
            body=body,
        )
        db.add(notification)

        resident = await db.get(User, resident_id)
        if resident and resident.max_user_id:
            try:
                await max_client.send_message(
                    resident.max_user_id,
                    f"📢 {building.address}\n\n{title}\n{body}",
                )
                notification.sent_to_max = True
                max_sent += 1
            except Exception as exc:
                # Пост сохраняется даже при временной недоступности MAX.
                max_failed += 1
                print(f"MAX post notification failed for user {resident_id}: {exc}")

    await db.commit()
    await db.refresh(event)

    return {
        "house": await building_to_house_payload(
            db,
            building,
            user.id if user.role == "resident" else None,
        ),
        "maxSent": max_sent,
        "maxFailed": max_failed,
    }


@app.post("/api/houses/{building_id}/requests/{request_id}/join")
async def join_collective_request(
    building_id: int,
    request_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "resident":
        raise HTTPException(403, "Only resident can join a request")

    await ensure_resident_has_house(db, user.id, building_id)
    request = await db.get(Request, request_id)
    if not request or request.building_id != building_id:
        raise HTTPException(404, "Request not found")
    if request.category != "Общее имущество":
        raise HTTPException(400, "This request is not collective")

    existing = await db.execute(
        select(RequestParticipant).where(
            RequestParticipant.request_id == request_id,
            RequestParticipant.user_id == user.id,
        )
    )
    if request.resident_id != user.id and not existing.scalars().first():
        db.add(RequestParticipant(request_id=request_id, user_id=user.id))
        await db.commit()

    building = await db.get(Building, building_id)
    return await building_to_house_payload(db, building, user.id)


@app.patch("/api/houses/{building_id}/requests/{request_id}")
async def update_resident_request(
    building_id: int,
    request_id: int,
    data: RequestUpdate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "resident":
        raise HTTPException(403, "Only resident can edit a request")

    await ensure_resident_has_house(db, user.id, building_id)
    request = await db.get(Request, request_id)
    if not request or request.building_id != building_id:
        raise HTTPException(404, "Request not found")
    if request.resident_id != user.id:
        raise HTTPException(403, "Only the request author can edit it")
    if request.status in ("DONE", "CANCELLED"):
        raise HTTPException(400, "Completed request cannot be edited")

    if data.category is not None:
        category = data.category.strip()
        if not category:
            raise HTTPException(400, "Category cannot be empty")
        request.category = category

    if data.description is not None:
        description = data.description.strip()
        if not description:
            raise HTTPException(400, "Description cannot be empty")
        request.description = description

    await db.commit()
    building = await db.get(Building, building_id)
    return await building_to_house_payload(db, building, user.id)


# ---------------------------------------------------------------------------
# Совместимость со старым API
# ---------------------------------------------------------------------------

@app.post("/api/buildings")
async def create_building(
    data: BuildingCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in ("management_company", "admin"):
        raise HTTPException(
            403,
            "Only management company can create buildings",
        )

    building = Building(
        management_company_id=user.id,
        **data.model_dump(),
    )
    db.add(building)
    await db.commit()
    await db.refresh(building)
    return building_to_dict(building)


@app.get("/api/buildings")
async def buildings(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role in ("management_company", "admin"):
        result = await db.execute(
            select(Building).where(
                Building.management_company_id == user.id
            )
        )
    else:
        result = await db.execute(select(Building))

    return [
        building_to_dict(row)
        for row in result.scalars().all()
    ]


@app.post("/api/buildings/join")
async def join_building(
    data: JoinBuilding,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    # Старый endpoint теперь использует ту же модель связи и не создаёт дубли.
    payload = HouseJoin(
        apartment_number=data.apartment_number,
        relation=data.relation,
    )
    return await join_house(data.building_id, payload, user, db)


@app.post("/api/requests")
async def create_request(
    data: RequestCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role != "resident":
        raise HTTPException(403, "Only resident can create request")

    await ensure_resident_has_house(
        db,
        user.id,
        data.building_id,
    )

    req = Request(
        resident_id=user.id,
        **data.model_dump(),
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)

    result = await db.execute(
        select(User).where(
            User.role.in_(["management_company", "manager"])
        )
    )

    for manager in result.scalars().all():
        notification = Notification(
            user_id=manager.id,
            title=f"Новая заявка №{req.id}",
            body=req.description,
        )
        db.add(notification)

        if manager.max_user_id:
            try:
                await max_client.send_message(
                    manager.max_user_id,
                    f"🔔 Новая заявка №{req.id}\n{req.description}",
                )
                notification.sent_to_max = True
            except Exception:
                pass

    await db.commit()
    return request_to_dict(req, user.id)


@app.get("/api/requests")
async def requests(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role == "resident":
        result = await db.execute(
            select(Request)
            .where(Request.resident_id == user.id)
            .order_by(Request.id.desc())
        )
    else:
        result = await db.execute(
            select(Request).order_by(Request.id.desc())
        )

    return [
        request_to_dict(row, user.id)
        for row in result.scalars().all()
    ]


@app.patch("/api/requests/{request_id}")
async def update_request(
    request_id: int,
    data: RequestStatus,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in (
        "manager",
        "management_company",
        "admin",
    ):
        raise HTTPException(403, "Manager role required")

    req = await db.get(Request, request_id)
    if not req:
        raise HTTPException(404, "Request not found")

    req.status = data.status
    await db.commit()

    notification = Notification(
        user_id=req.resident_id,
        title=f"Заявка №{req.id} обновлена",
        body=f"Новый статус: {req.status}",
    )
    db.add(notification)

    resident = await db.get(User, req.resident_id)
    if resident and resident.max_user_id:
        try:
            await max_client.send_message(
                resident.max_user_id,
                f"🔔 Заявка №{req.id}\nНовый статус: {req.status}",
            )
            notification.sent_to_max = True
        except Exception:
            pass

    await db.commit()
    return request_to_dict(req, user.id)


@app.post("/api/news")
async def create_news(
    data: NewsCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in (
        "management_company",
        "manager",
        "admin",
    ):
        raise HTTPException(403, "Management role required")

    news = News(
        author_id=user.id,
        **data.model_dump(),
    )
    db.add(news)
    await db.commit()
    await db.refresh(news)

    result = await db.execute(
        select(Subscription).where(
            Subscription.building_id == data.building_id,
            Subscription.enabled == True,  # noqa: E712
            Subscription.type.in_(["NEWS", "IMPORTANT"]),
        )
    )

    for sub in result.scalars().all():
        if data.important or sub.type == "NEWS":
            notification = Notification(
                user_id=sub.user_id,
                title=data.title,
                body=data.body,
            )
            db.add(notification)

            resident = await db.get(User, sub.user_id)
            if resident and resident.max_user_id:
                try:
                    await max_client.send_message(
                        resident.max_user_id,
                        f"📢 {data.title}\n{data.body}",
                    )
                    notification.sent_to_max = True
                except Exception:
                    pass

    await db.commit()
    return news_to_dict(news)


@app.get("/api/news")
async def get_news(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(News).order_by(News.id.desc())
    )
    return [
        news_to_dict(row)
        for row in result.scalars().all()
    ]


@app.post("/api/subscriptions")
async def subscribe(
    data: SubscriptionCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = Subscription(
        user_id=user.id,
        **data.model_dump(),
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    return {
        "id": sub.id,
        "building_id": sub.building_id,
        "type": sub.type,
        "enabled": sub.enabled,
    }


@app.get("/api/notifications")
async def notifications(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.id.desc())
    )

    return [
        {
            "id": notification.id,
            "title": notification.title,
            "body": notification.body,
            "read": notification.read,
            "created_at": notification.created_at.isoformat(),
        }
        for notification in result.scalars().all()
    ]


@app.post("/webhook")
async def webhook(
    x_max_bot_api_secret: str | None = Header(None),
    payload: dict = {},
):
    if (
        settings.webhook_secret
        and x_max_bot_api_secret != settings.webhook_secret
    ):
        raise HTTPException(401, "Invalid webhook secret")

    from .bot import handle_update

    await handle_update(payload)
    update_type = payload.get("update_type", "")
    return {"ok": True, "update_type": update_type}


def user_to_dict(user: User):
    return {
        "id": user.id,
        "max_user_id": user.max_user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
    }


def building_to_dict(building: Building):
    return {
        "id": building.id,
        "name": building.name,
        "address": building.address,
        "description": building.description,
        "apartments_count": building.apartments_count,
    }


def request_to_dict(request: Request, current_user_id: int | None = None):
    return {
        "id": request.id,
        "resident_id": request.resident_id,
        "building_id": request.building_id,
        "buildingId": request.building_id,
        "category": request.category,
        "description": request.description,
        "status": request.status,
        "created_at": request.created_at.isoformat(),
        "createdAt": request.created_at.isoformat(),
        "residents": 1,
        "isMine": bool(
            current_user_id
            and request.resident_id == current_user_id
        ),
    }


def news_to_dict(news: News):
    return {
        "id": news.id,
        "building_id": news.building_id,
        "author_id": news.author_id,
        "title": news.title,
        "body": news.body,
        "important": news.important,
        "created_at": news.created_at.isoformat(),
    }


static_directory = Path(__file__).resolve().parent.parent / "static"
if static_directory.exists():
    app.mount(
        "/",
        StaticFiles(directory=static_directory, html=True),
        name="mini-app",
    )
