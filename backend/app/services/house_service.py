from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Building,
    BuildingEvent,
    BuildingProfile,
    Meter,
    Repair,
    Request,
    RequestParticipant,
    ResidentBuilding,
    ResidentBuildingMeta,
)
from app.services.building_state import derive_building_state


def _iso(value):
    return value.isoformat() if value else None


async def get_building_parts(
    db: AsyncSession,
    building_id: int,
    resident_id: int | None = None,
):
    profile = await db.get(BuildingProfile, building_id)

    events_result = await db.execute(
        select(BuildingEvent)
        .where(BuildingEvent.building_id == building_id)
        .order_by(BuildingEvent.id.desc())
    )
    events = list(events_result.scalars().all())

    meters_result = await db.execute(
        select(Meter)
        .where(Meter.building_id == building_id)
        .order_by(Meter.id.asc())
    )
    meters = list(meters_result.scalars().all())

    requests_result = await db.execute(
        select(Request)
        .where(Request.building_id == building_id)
        .order_by(Request.id.desc())
    )
    requests = list(requests_result.scalars().all())

    participant_result = await db.execute(
        select(RequestParticipant).where(
            RequestParticipant.request_id.in_([request.id for request in requests])
        )
    ) if requests else None
    participants = (
        list(participant_result.scalars().all())
        if participant_result is not None
        else []
    )

    repairs_result = await db.execute(
        select(Repair)
        .where(Repair.building_id == building_id)
        .order_by(Repair.year.asc(), Repair.id.asc())
    )
    repairs = list(repairs_result.scalars().all())

    resident_link = None
    resident_meta = None
    if resident_id is not None:
        link_result = await db.execute(
            select(ResidentBuilding).where(
                ResidentBuilding.user_id == resident_id,
                ResidentBuilding.building_id == building_id,
            )
        )
        resident_link = link_result.scalars().first()

        meta_result = await db.execute(
            select(ResidentBuildingMeta).where(
                ResidentBuildingMeta.user_id == resident_id,
                ResidentBuildingMeta.building_id == building_id,
            )
        )
        resident_meta = meta_result.scalars().first()

    return (
        profile,
        events,
        meters,
        requests,
        repairs,
        resident_link,
        resident_meta,
        participants,
    )


async def building_to_house_payload(
    db: AsyncSession,
    building: Building,
    resident_id: int | None = None,
) -> dict:
    (
        profile,
        events,
        meters,
        requests,
        repairs,
        resident_link,
        resident_meta,
        participants,
    ) = await get_building_parts(db, building.id, resident_id)

    participant_counts: dict[int, int] = {}
    participant_request_ids: set[int] = set()
    for participant in participants:
        participant_counts[participant.request_id] = (
            participant_counts.get(participant.request_id, 0) + 1
        )
        if resident_id and participant.user_id == resident_id:
            participant_request_ids.add(participant.request_id)

    state = derive_building_state(
        events=events,
        meters=meters,
        requests=(
            requests
            if resident_id is None
            else [
                request
                for request in requests
                if request.resident_id == resident_id
                or request.id in participant_request_ids
            ]
        ),
        repairs=repairs,
    )

    p = profile
    apartment = resident_link.apartment_number if resident_link else ""
    relation = resident_meta.relation if resident_meta else ""

    return {
        "id": building.id,
        "address": building.address,
        "city": p.city if p else "",
        "district": p.district if p else "",
        "street": p.street if p else building.address,
        "houseNumber": p.house_number if p else "",
        "year": p.year if p else 0,
        "floors": p.floors if p else 0,
        "entrances": p.entrances if p else 0,
        "apartments": building.apartments_count,
        "type": p.building_type if p else "",
        "area": p.area if p else "",
        "company": p.company if p else "",
        "image": {
            1: "/assets/houses/pushkina-7.png",
            2: "/assets/houses/pushkina-7a.png",
            3: "/assets/houses/pushkina-12.png",
            5: "/assets/houses/mira-24.png",
            9: "/assets/houses/lenina-18.png",
        }.get(building.id),
        "emergencyPhone": p.emergency_phone if p else "",
        "apartment": apartment,
        "relation": relation,
        "state": state,
        "meters": [
            {
                "id": meter.id,
                "buildingId": meter.building_id,
                "kind": meter.kind,
                "name": meter.name,
                "unit": meter.unit,
                "lastValue": meter.last_value,
                "lastSubmittedAt": _iso(meter.last_submitted_at),
                "nextSubmissionDate": _iso(meter.next_submission_date),
                "submissionRequired": meter.submission_required,
            }
            for meter in meters
        ],
        "events": [
            {
                "id": event.id,
                "buildingId": event.building_id,
                "type": event.event_type,
                "severity": event.severity,
                "title": event.title,
                "body": event.body,
                "date": event.date_label,
                "icon": event.icon,
                "requiresAttention": event.requires_attention,
                "resolved": event.resolved,
                "startsAt": _iso(event.starts_at),
            }
            for event in events
        ],
        "requests": [
            {
                "id": request.id,
                "buildingId": request.building_id,
                "category": request.category,
                "description": request.description,
                "status": request.status,
                "createdAt": _iso(request.created_at),
                "residents": 1 + participant_counts.get(request.id, 0),
                "isMine": bool(
                    resident_id
                    and (
                        request.resident_id == resident_id
                        or request.id in participant_request_ids
                    )
                ),
                "collective": request.category == "Общее имущество",
                "canEdit": bool(
                    resident_id and request.resident_id == resident_id
                ),
            }
            for request in requests
        ],
        "repairs": [
            {
                "id": repair.id,
                "buildingId": repair.building_id,
                "title": repair.title,
                "description": repair.description,
                "status": repair.status,
                "year": repair.year,
                "severity": repair.severity,
                "requiresAttention": repair.requires_attention,
            }
            for repair in repairs
        ],
    }


async def catalog_payload(
    db: AsyncSession,
    resident_id: int | None = None,
) -> list[dict]:
    """
    Лёгкий каталог для поиска дома.

    В каталоге не тащим события/заявки/счётчики/ремонты всех 36 домов.
    Полные дочерние данные запрашиваются только для домов пользователя
    или для конкретного /api/houses/{id}. Это убирает N+1 на поиске
    и нормально масштабируется при росте каталога.
    """
    buildings_result = await db.execute(
        select(Building).order_by(Building.id.asc())
    )
    buildings = list(buildings_result.scalars().all())

    profiles_result = await db.execute(select(BuildingProfile))
    profiles = {
        profile.building_id: profile
        for profile in profiles_result.scalars().all()
    }

    links: dict[int, ResidentBuilding] = {}
    metas: dict[int, ResidentBuildingMeta] = {}

    if resident_id is not None:
        link_result = await db.execute(
            select(ResidentBuilding).where(
                ResidentBuilding.user_id == resident_id
            )
        )
        links = {
            link.building_id: link
            for link in link_result.scalars().all()
        }

        meta_result = await db.execute(
            select(ResidentBuildingMeta).where(
                ResidentBuildingMeta.user_id == resident_id
            )
        )
        metas = {
            meta.building_id: meta
            for meta in meta_result.scalars().all()
        }

    result: list[dict] = []
    for building in buildings:
        profile = profiles.get(building.id)
        link = links.get(building.id)
        meta = metas.get(building.id)

        result.append(
            {
                "id": building.id,
                "address": building.address,
                "city": profile.city if profile else "",
                "district": profile.district if profile else "",
                "street": profile.street if profile else building.address,
                "houseNumber": profile.house_number if profile else "",
                "year": profile.year if profile else 0,
                "floors": profile.floors if profile else 0,
                "entrances": profile.entrances if profile else 0,
                "apartments": building.apartments_count,
                "type": profile.building_type if profile else "",
                "area": profile.area if profile else "",
                "company": profile.company if profile else "",
                "image": {
                    1: "/assets/houses/pushkina-7.png",
                    2: "/assets/houses/pushkina-7a.png",
                    3: "/assets/houses/pushkina-12.png",
                    5: "/assets/houses/mira-24.png",
                    9: "/assets/houses/lenina-18.png",
                }.get(building.id),
                "emergencyPhone": (
                    profile.emergency_phone if profile else ""
                ),
                "apartment": link.apartment_number if link else "",
                "relation": meta.relation if meta else "",
                "state": {
                    "level": None,
                    "label": None,
                    "reasons": [],
                },
                "meters": [],
                "events": [],
                "requests": [],
                "repairs": [],
            }
        )

    return result

async def my_houses_payload(db: AsyncSession, resident_id: int) -> list[dict]:
    link_result = await db.execute(
        select(ResidentBuilding)
        .where(ResidentBuilding.user_id == resident_id)
        .order_by(ResidentBuilding.id.asc())
    )
    links = list(link_result.scalars().all())

    seen: set[int] = set()
    building_ids: list[int] = []
    for link in links:
        if link.building_id not in seen:
            seen.add(link.building_id)
            building_ids.append(link.building_id)

    houses: list[dict] = []
    for building_id in building_ids:
        building = await db.get(Building, building_id)
        if building:
            houses.append(
                await building_to_house_payload(db, building, resident_id)
            )

    return houses
