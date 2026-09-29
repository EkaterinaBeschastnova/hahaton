from datetime import datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    max_user_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    first_name: Mapped[str] = mapped_column(String(100), default="")
    last_name: Mapped[str] = mapped_column(String(100), default="")
    role: Mapped[str] = mapped_column(String(40), default="resident")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class MiniAppRegistration(Base):
    """Завершённая регистрация пользователя в Mini App через MAX."""

    __tablename__ = "mini_app_registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    max_user_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    phone: Mapped[str] = mapped_column(String(80), default="")
    auth_provider: Mapped[str] = mapped_column(String(40), default="phone")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Building(Base):
    """
    Базовая сущность дома.

    Здесь намеренно остаются только стабильные поля.
    Динамические данные (события, заявки, счётчики, ремонты)
    живут в отдельных таблицах и всегда ссылаются на building_id.
    """

    __tablename__ = "buildings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    management_company_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(500), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    apartments_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class BuildingProfile(Base):
    __tablename__ = "building_profiles"

    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"), primary_key=True)
    city: Mapped[str] = mapped_column(String(120), default="")
    district: Mapped[str] = mapped_column(String(120), default="")
    street: Mapped[str] = mapped_column(String(200), default="")
    house_number: Mapped[str] = mapped_column(String(50), default="")
    year: Mapped[int] = mapped_column(Integer, default=0)
    floors: Mapped[int] = mapped_column(Integer, default=0)
    entrances: Mapped[int] = mapped_column(Integer, default=0)
    building_type: Mapped[str] = mapped_column(String(120), default="")
    area: Mapped[str] = mapped_column(String(120), default="")
    company: Mapped[str] = mapped_column(String(200), default="")
    emergency_phone: Mapped[str] = mapped_column(String(80), default="+7 (495) 123-45-67")


class ResidentBuilding(Base):
    __tablename__ = "resident_buildings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"))
    apartment_number: Mapped[str] = mapped_column(String(30), default="")
    verified: Mapped[bool] = mapped_column(Boolean, default=False)


class ResidentBuildingMeta(Base):
    """
    Дополнительные данные связи жителя с домом.

    Отдельная таблица позволяет не ломать старую resident_buildings
    при переходе с предыдущей версии базы.
    """

    __tablename__ = "resident_building_meta"
    __table_args__ = (
        UniqueConstraint("user_id", "building_id", name="uq_resident_building_meta"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"))
    relation: Mapped[str] = mapped_column(String(40), default="resident")


class Request(Base):
    __tablename__ = "requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    resident_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"))
    category: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(40), default="NEW")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class RequestParticipant(Base):
    """Жители, присоединившиеся к коллективной заявке."""

    __tablename__ = "request_participants"
    __table_args__ = (
        UniqueConstraint("request_id", "user_id", name="uq_request_participant"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("requests.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Meter(Base):
    __tablename__ = "meters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"), index=True)
    kind: Mapped[str] = mapped_column(String(60))
    name: Mapped[str] = mapped_column(String(120))
    unit: Mapped[str] = mapped_column(String(40))
    last_value: Mapped[str] = mapped_column(String(80), default="")
    last_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_submission_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_required: Mapped[bool] = mapped_column(Boolean, default=False)


class BuildingEvent(Base):
    __tablename__ = "building_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(60), default="announcement")
    severity: Mapped[str] = mapped_column(String(30), default="info")
    title: Mapped[str] = mapped_column(String(220))
    body: Mapped[str] = mapped_column(Text, default="")
    date_label: Mapped[str] = mapped_column(String(80), default="")
    icon: Mapped[str] = mapped_column(String(20), default="▤")
    requires_attention: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Repair(Base):
    __tablename__ = "repairs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"), index=True)
    title: Mapped[str] = mapped_column(String(220))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="PLANNED")
    year: Mapped[int] = mapped_column(Integer, default=0)
    severity: Mapped[str] = mapped_column(String(30), default="info")
    requires_attention: Mapped[bool] = mapped_column(Boolean, default=False)


class News(Base):
    __tablename__ = "news"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"))
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    important: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    building_id: Mapped[int] = mapped_column(ForeignKey("buildings.id"))
    type: Mapped[str] = mapped_column(String(50))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_to_max: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
