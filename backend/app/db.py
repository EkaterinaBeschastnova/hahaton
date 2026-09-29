from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    # Импорт моделей обязателен до create_all.
    from . import models  # noqa: F401
    from .seed import seed_demo_data

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed идемпотентный: повторный запуск не создаёт дубли.
    async with SessionLocal() as session:
        await seed_demo_data(session)


async def get_db():
    async with SessionLocal() as session:
        yield session
