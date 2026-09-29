from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Building,
    BuildingEvent,
    BuildingProfile,
    Meter,
    Repair,
    Request,
    ResidentBuilding,
    ResidentBuildingMeta,
    User,
)


HOUSE_CATALOG = [{'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Пушкина',
  'house_number': '7',
  'address': 'ул. Пушкина, 7',
  'year': 2018,
  'floors': 12,
  'entrances': 4,
  'apartments': 320,
  'building_type': 'Панельный',
  'area': '18 420 м²',
  'company': 'ООО «ЖилСервис»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Пушкина',
  'house_number': '7А',
  'address': 'ул. Пушкина, 7А',
  'year': 2016,
  'floors': 10,
  'entrances': 3,
  'apartments': 240,
  'building_type': 'Монолитный',
  'area': '13 100 м²',
  'company': 'ООО «ЖилСервис»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Пушкина',
  'house_number': '12',
  'address': 'ул. Пушкина, 12',
  'year': 2012,
  'floors': 9,
  'entrances': 3,
  'apartments': 180,
  'building_type': 'Панельный',
  'area': '10 800 м²',
  'company': 'ООО «ЖилСервис»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Пушкина',
  'house_number': '18',
  'address': 'ул. Пушкина, 18',
  'year': 2020,
  'floors': 16,
  'entrances': 5,
  'apartments': 410,
  'building_type': 'Монолитный',
  'area': '24 500 м²',
  'company': 'ООО «КомфортДом»'},
 {'city': 'Москва',
  'district': 'СВАО',
  'street': 'проспект Мира',
  'house_number': '24',
  'address': 'проспект Мира, 24',
  'year': 2015,
  'floors': 14,
  'entrances': 5,
  'apartments': 350,
  'building_type': 'Монолитный',
  'area': '22 600 м²',
  'company': 'ООО «КомфортДом»'},
 {'city': 'Москва',
  'district': 'СВАО',
  'street': 'проспект Мира',
  'house_number': '26',
  'address': 'проспект Мира, 26',
  'year': 2017,
  'floors': 17,
  'entrances': 5,
  'apartments': 430,
  'building_type': 'Панельный',
  'area': '25 100 м²',
  'company': 'ООО «КомфортДом»'},
 {'city': 'Москва',
  'district': 'СВАО',
  'street': 'проспект Мира',
  'house_number': '28',
  'address': 'проспект Мира, 28',
  'year': 2019,
  'floors': 20,
  'entrances': 6,
  'apartments': 510,
  'building_type': 'Монолитный',
  'area': '30 400 м²',
  'company': 'ООО «КомфортДом»'},
 {'city': 'Москва',
  'district': 'СВАО',
  'street': 'проспект Мира',
  'house_number': '31',
  'address': 'проспект Мира, 31',
  'year': 2010,
  'floors': 12,
  'entrances': 4,
  'apartments': 280,
  'building_type': 'Панельный',
  'area': '17 200 м²',
  'company': 'ООО «КомфортДом»'},
 {'city': 'Москва',
  'district': 'ЮАО',
  'street': 'ул. Ленина',
  'house_number': '18',
  'address': 'ул. Ленина, 18',
  'year': 2008,
  'floors': 9,
  'entrances': 3,
  'apartments': 190,
  'building_type': 'Панельный',
  'area': '11 700 м²',
  'company': 'ООО «ЖилСервис»'},
 {'city': 'Москва',
  'district': 'ЮАО',
  'street': 'ул. Ленина',
  'house_number': '21',
  'address': 'ул. Ленина, 21',
  'year': 2014,
  'floors': 12,
  'entrances': 4,
  'apartments': 270,
  'building_type': 'Монолитный',
  'area': '16 900 м²',
  'company': 'ООО «ЖилСервис»'},
 {'city': 'Москва',
  'district': 'ЮАО',
  'street': 'ул. Ленина',
  'house_number': '25',
  'address': 'ул. Ленина, 25',
  'year': 2006,
  'floors': 9,
  'entrances': 4,
  'apartments': 216,
  'building_type': 'Кирпичный',
  'area': '13 200 м²',
  'company': 'ООО «ЖилСервис»'},
 {'city': 'Москва',
  'district': 'ЮАО',
  'street': 'ул. Ленина',
  'house_number': '30',
  'address': 'ул. Ленина, 30',
  'year': 2021,
  'floors': 18,
  'entrances': 6,
  'apartments': 460,
  'building_type': 'Монолитный',
  'area': '28 700 м²',
  'company': 'ООО «КомфортДом»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Садовая',
  'house_number': '5',
  'address': 'ул. Садовая, 5',
  'year': 1998,
  'floors': 7,
  'entrances': 2,
  'apartments': 96,
  'building_type': 'Кирпичный',
  'area': '6 400 м²',
  'company': 'ООО «ГородДом»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Садовая',
  'house_number': '7',
  'address': 'ул. Садовая, 7',
  'year': 2002,
  'floors': 8,
  'entrances': 2,
  'apartments': 120,
  'building_type': 'Кирпичный',
  'area': '7 500 м²',
  'company': 'ООО «ГородДом»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Садовая',
  'house_number': '10',
  'address': 'ул. Садовая, 10',
  'year': 2011,
  'floors': 10,
  'entrances': 3,
  'apartments': 210,
  'building_type': 'Панельный',
  'area': '12 800 м²',
  'company': 'ООО «ГородДом»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Тверская',
  'house_number': '8',
  'address': 'ул. Тверская, 8',
  'year': 1956,
  'floors': 8,
  'entrances': 2,
  'apartments': 84,
  'building_type': 'Кирпичный',
  'area': '6 900 м²',
  'company': 'ООО «ЦентрЖил»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Тверская',
  'house_number': '12',
  'address': 'ул. Тверская, 12',
  'year': 1964,
  'floors': 9,
  'entrances': 2,
  'apartments': 108,
  'building_type': 'Кирпичный',
  'area': '8 100 м²',
  'company': 'ООО «ЦентрЖил»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Тверская',
  'house_number': '15',
  'address': 'ул. Тверская, 15',
  'year': 2009,
  'floors': 11,
  'entrances': 3,
  'apartments': 150,
  'building_type': 'Монолитный',
  'area': '10 300 м²',
  'company': 'ООО «ЦентрЖил»'},
 {'city': 'Москва',
  'district': 'САО',
  'street': 'Ленинградский проспект',
  'house_number': '24',
  'address': 'Ленинградский проспект, 24',
  'year': 2013,
  'floors': 16,
  'entrances': 5,
  'apartments': 380,
  'building_type': 'Монолитный',
  'area': '23 600 м²',
  'company': 'ООО «СеверДом»'},
 {'city': 'Москва',
  'district': 'САО',
  'street': 'Ленинградский проспект',
  'house_number': '31',
  'address': 'Ленинградский проспект, 31',
  'year': 2018,
  'floors': 22,
  'entrances': 6,
  'apartments': 540,
  'building_type': 'Монолитный',
  'area': '32 800 м²',
  'company': 'ООО «СеверДом»'},
 {'city': 'Москва',
  'district': 'САО',
  'street': 'Ленинградский проспект',
  'house_number': '35',
  'address': 'Ленинградский проспект, 35',
  'year': 2020,
  'floors': 24,
  'entrances': 7,
  'apartments': 620,
  'building_type': 'Монолитный',
  'area': '37 900 м²',
  'company': 'ООО «СеверДом»'},
 {'city': 'Москва',
  'district': 'ЗАО',
  'street': 'Кутузовский проспект',
  'house_number': '10',
  'address': 'Кутузовский проспект, 10',
  'year': 1960,
  'floors': 10,
  'entrances': 3,
  'apartments': 130,
  'building_type': 'Кирпичный',
  'area': '9 200 м²',
  'company': 'ООО «ЗападЖил»'},
 {'city': 'Москва',
  'district': 'ЗАО',
  'street': 'Кутузовский проспект',
  'house_number': '18',
  'address': 'Кутузовский проспект, 18',
  'year': 2007,
  'floors': 14,
  'entrances': 4,
  'apartments': 290,
  'building_type': 'Монолитный',
  'area': '18 300 м²',
  'company': 'ООО «ЗападЖил»'},
 {'city': 'Москва',
  'district': 'ЗАО',
  'street': 'Кутузовский проспект',
  'house_number': '25',
  'address': 'Кутузовский проспект, 25',
  'year': 2019,
  'floors': 20,
  'entrances': 6,
  'apartments': 470,
  'building_type': 'Монолитный',
  'area': '29 100 м²',
  'company': 'ООО «ЗападЖил»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Арбат',
  'house_number': '12',
  'address': 'ул. Арбат, 12',
  'year': 1938,
  'floors': 6,
  'entrances': 2,
  'apartments': 54,
  'building_type': 'Кирпичный',
  'area': '5 100 м²',
  'company': 'ООО «ЦентрЖил»'},
 {'city': 'Москва',
  'district': 'ЦАО',
  'street': 'ул. Арбат',
  'house_number': '20',
  'address': 'ул. Арбат, 20',
  'year': 1952,
  'floors': 7,
  'entrances': 2,
  'apartments': 68,
  'building_type': 'Кирпичный',
  'area': '5 900 м²',
  'company': 'ООО «ЦентрЖил»'},
 {'city': 'Москва',
  'district': 'ЮЗАО',
  'street': 'ул. Гагарина',
  'house_number': '3',
  'address': 'ул. Гагарина, 3',
  'year': 2004,
  'floors': 12,
  'entrances': 4,
  'apartments': 260,
  'building_type': 'Панельный',
  'area': '15 800 м²',
  'company': 'ООО «ЮгДом»'},
 {'city': 'Москва',
  'district': 'ЮЗАО',
  'street': 'ул. Гагарина',
  'house_number': '8',
  'address': 'ул. Гагарина, 8',
  'year': 2016,
  'floors': 17,
  'entrances': 5,
  'apartments': 390,
  'building_type': 'Монолитный',
  'area': '24 200 м²',
  'company': 'ООО «ЮгДом»'},
 {'city': 'Москва',
  'district': 'ЗАО',
  'street': 'ул. Молодёжная',
  'house_number': '14',
  'address': 'ул. Молодёжная, 14',
  'year': 2011,
  'floors': 14,
  'entrances': 4,
  'apartments': 300,
  'building_type': 'Панельный',
  'area': '18 100 м²',
  'company': 'ООО «ЗападЖил»'},
 {'city': 'Москва',
  'district': 'ЗАО',
  'street': 'ул. Молодёжная',
  'house_number': '20',
  'address': 'ул. Молодёжная, 20',
  'year': 2022,
  'floors': 21,
  'entrances': 6,
  'apartments': 520,
  'building_type': 'Монолитный',
  'area': '31 600 м²',
  'company': 'ООО «ЗападЖил»'},
 {'city': 'Москва',
  'district': 'СВАО',
  'street': 'ул. Академика Королёва',
  'house_number': '5',
  'address': 'ул. Академика Королёва, 5',
  'year': 2005,
  'floors': 14,
  'entrances': 4,
  'apartments': 310,
  'building_type': 'Панельный',
  'area': '18 900 м²',
  'company': 'ООО «КомфортДом»'},
 {'city': 'Москва',
  'district': 'СВАО',
  'street': 'ул. Академика Королёва',
  'house_number': '12',
  'address': 'ул. Академика Королёва, 12',
  'year': 2017,
  'floors': 19,
  'entrances': 5,
  'apartments': 440,
  'building_type': 'Монолитный',
  'area': '27 100 м²',
  'company': 'ООО «КомфортДом»'},
 {'city': 'Москва',
  'district': 'ВАО',
  'street': 'ул. Новая',
  'house_number': '4',
  'address': 'ул. Новая, 4',
  'year': 2001,
  'floors': 9,
  'entrances': 3,
  'apartments': 180,
  'building_type': 'Панельный',
  'area': '10 900 м²',
  'company': 'ООО «ВостокДом»'},
 {'city': 'Москва',
  'district': 'ВАО',
  'street': 'ул. Новая',
  'house_number': '9',
  'address': 'ул. Новая, 9',
  'year': 2015,
  'floors': 15,
  'entrances': 5,
  'apartments': 340,
  'building_type': 'Монолитный',
  'area': '21 000 м²',
  'company': 'ООО «ВостокДом»'},
 {'city': 'Москва',
  'district': 'ВАО',
  'street': 'ул. Центральная',
  'house_number': '6',
  'address': 'ул. Центральная, 6',
  'year': 1999,
  'floors': 9,
  'entrances': 3,
  'apartments': 170,
  'building_type': 'Панельный',
  'area': '10 400 м²',
  'company': 'ООО «ВостокДом»'},
 {'city': 'Москва',
  'district': 'ВАО',
  'street': 'ул. Центральная',
  'house_number': '15',
  'address': 'ул. Центральная, 15',
  'year': 2018,
  'floors': 16,
  'entrances': 5,
  'apartments': 360,
  'building_type': 'Монолитный',
  'area': '22 300 м²',
  'company': 'ООО «ВостокДом»'}]

# В демонстрационной базе оставляем только три полностью наполненных дома.
DEMO_ADDRESSES = {
    "ул. Пушкина, 7",
    "проспект Мира, 24",
    "ул. Ленина, 18",
}
HOUSE_CATALOG = [
    item for item in HOUSE_CATALOG if item["address"] in DEMO_ADDRESSES
]


def _next_25th() -> datetime:
    now = datetime.now(timezone.utc)
    year = now.year
    month = now.month
    if now.day > 25:
        if month == 12:
            year += 1
            month = 1
        else:
            month += 1
    return datetime(year, month, 25, 23, 59, tzinfo=timezone.utc)


async def _get_or_create_demo_user(db: AsyncSession) -> User:
    result = await db.execute(
        select(User).where(
            User.first_name == "Анна",
            User.last_name == "Иванова",
            User.role == "resident",
        )
    )
    user = result.scalars().first()
    if user:
        return user

    user = User(first_name="Анна", last_name="Иванова", role="resident")
    db.add(user)
    await db.flush()
    return user


async def seed_demo_data(db: AsyncSession) -> None:
    """
    Идемпотентный seed.

    Можно запускать при каждом старте: существующие дома и их дочерние
    записи не дублируются. Адрес является устойчивым ключом для демо-каталога.
    """

    demo_user = await _get_or_create_demo_user(db)

    reporter_result = await db.execute(
        select(User).where(
            User.first_name == "Мария",
            User.last_name == "Соколова",
            User.role == "resident",
        )
    )
    collective_reporter = reporter_result.scalars().first()
    if not collective_reporter:
        collective_reporter = User(
            first_name="Мария",
            last_name="Соколова",
            role="resident",
        )
        db.add(collective_reporter)
        await db.flush()

    building_by_address: dict[str, Building] = {}

    for item in HOUSE_CATALOG:
        result = await db.execute(
            select(Building).where(Building.address == item["address"])
        )
        building = result.scalars().first()

        if not building:
            building = Building(
                name=item["address"],
                address=item["address"],
                description=f'Жилой дом: {item["address"]}',
                apartments_count=item["apartments"],
            )
            db.add(building)
            await db.flush()

        building_by_address[item["address"]] = building

        profile = await db.get(BuildingProfile, building.id)
        if not profile:
            profile = BuildingProfile(
                building_id=building.id,
                city=item["city"],
                district=item["district"],
                street=item["street"],
                house_number=item["house_number"],
                year=item["year"],
                floors=item["floors"],
                entrances=item["entrances"],
                building_type=item["building_type"],
                area=item["area"],
                company=item["company"],
            )
            db.add(profile)

        meter_result = await db.execute(
            select(Meter).where(Meter.building_id == building.id)
        )
        if not meter_result.scalars().first():
            due = _next_25th()
            needs_submission = item["address"] == "ул. Пушкина, 7"
            base = building.id * 10
            db.add_all(
                [
                    Meter(
                        building_id=building.id,
                        kind="cold_water",
                        name="Холодная вода",
                        unit="м³",
                        last_value=str(110 + base),
                        next_submission_date=due,
                        submission_required=needs_submission,
                    ),
                    Meter(
                        building_id=building.id,
                        kind="hot_water",
                        name="Горячая вода",
                        unit="м³",
                        last_value=str(70 + base // 2),
                        next_submission_date=due,
                        submission_required=needs_submission,
                    ),
                    Meter(
                        building_id=building.id,
                        kind="electricity",
                        name="Электроэнергия",
                        unit="кВт⋅ч",
                        last_value=str(1800 + base * 3),
                        next_submission_date=due,
                        submission_required=False,
                    ),
                ]
            )

        current_year = datetime.now(timezone.utc).year
        repair_result = await db.execute(
            select(Repair).where(Repair.building_id == building.id)
        )
        if not repair_result.scalars().first():
            db.add_all(
                [
                    Repair(
                        building_id=building.id,
                        title="Плановое обслуживание инженерных систем",
                        description="Регламентные работы завершены.",
                        status="DONE",
                        year=current_year - 1,
                    ),
                    Repair(
                        building_id=building.id,
                        title="Ремонт кровли",
                        description="Работы включены в план капитального ремонта.",
                        status="PLANNED",
                        year=current_year + 1,
                    ),
                    Repair(
                        building_id=building.id,
                        title="Ремонт фасада",
                        description="Работы запланированы программой капитального ремонта.",
                        status="PLANNED",
                        year=current_year + 3,
                    ),
                ]
            )

        completed_repair_seeds = [
            (
                "Починили входную дверь",
                "Заменили доводчик и отрегулировали замок.",
            ),
            (
                "Восстановили фонтан во дворе",
                "Очистили чашу, обновили насос и подсветку.",
            ),
        ]
        for title, description in completed_repair_seeds:
            completed_result = await db.execute(
                select(Repair).where(
                    Repair.building_id == building.id,
                    Repair.title == title,
                )
            )
            if not completed_result.scalars().first():
                db.add(
                    Repair(
                        building_id=building.id,
                        title=title,
                        description=description,
                        status="DONE",
                        year=current_year,
                    )
                )

    await db.flush()

    # Связи демо-жителя: ID берутся из реальных записей домов, а не захардкожены.
    defaults = [
        ("ул. Пушкина, 7", "45"),
        ("проспект Мира, 24", "8"),
        ("ул. Ленина, 18", "12"),
    ]
    for address, apartment in defaults:
        building = building_by_address[address]

        link_result = await db.execute(
            select(ResidentBuilding).where(
                ResidentBuilding.user_id == demo_user.id,
                ResidentBuilding.building_id == building.id,
            )
        )
        link = link_result.scalars().first()
        if not link:
            db.add(
                ResidentBuilding(
                    user_id=demo_user.id,
                    building_id=building.id,
                    apartment_number=apartment,
                    verified=True,
                )
            )

        meta_result = await db.execute(
            select(ResidentBuildingMeta).where(
                ResidentBuildingMeta.user_id == demo_user.id,
                ResidentBuildingMeta.building_id == building.id,
            )
        )
        if not meta_result.scalars().first():
            db.add(
                ResidentBuildingMeta(
                    user_id=demo_user.id,
                    building_id=building.id,
                    relation="owner",
                )
            )

    await db.flush()

    # События привязаны ТОЛЬКО через building_id.
    event_seeds = {
        "ул. Пушкина, 7": [
            dict(
                event_type="important",
                severity="attention",
                title="Сломана входная дверь в первом подъезде",
                body="Дверь не закрывается из-за неисправного доводчика. Заявка передана мастеру, ремонт запланирован на сегодня с 16:00 до 18:00.",
                date_label="Сегодня",
                icon="🚪",
                requires_attention=True,
            ),
            dict(
                event_type="work",
                severity="info",
                title="Промывка системы отопления",
                body="Во вторник специалисты проведут профилактическую промывку системы отопления. Доступ в квартиры не потребуется.",
                date_label="Завтра",
                icon="🔧",
                requires_attention=False,
            ),
            dict(
                event_type="good",
                severity="info",
                title="Во дворе установили новые фонари",
                body="Заменили шесть опор освещения у детской площадки и настроили автоматическое включение в вечернее время.",
                date_label="2 дня назад",
                icon="💡",
                requires_attention=False,
            ),
        ],
        "проспект Мира, 24": [
            dict(
                event_type="important",
                severity="urgent",
                title="Не работает пассажирский лифт",
                body="Лифт во втором подъезде остановлен из-за неисправности привода дверей. Подрядчик уже проводит диагностику, восстановление ожидается до 20:00.",
                date_label="Сегодня",
                icon="🛗",
                requires_attention=True,
            ),
            dict(
                event_type="announcement",
                severity="info",
                title="Собрание собственников 3 октября",
                body="Обсудим благоустройство двора, установку камер у подъездов и план текущего ремонта на следующий год.",
                date_label="Сегодня",
                icon="📋",
                requires_attention=False,
            ),
            dict(
                event_type="good",
                severity="info",
                title="Завершили ремонт входной группы",
                body="В первом подъезде покрасили стены, заменили почтовые ящики и установили энергосберегающие светильники.",
                date_label="Вчера",
                icon="✨",
                requires_attention=False,
            ),
        ],
        "ул. Ленина, 18": [
            dict(
                event_type="work",
                severity="attention",
                title="Протечка кровли над девятым этажом",
                body="После сильного дождя обнаружена протечка над квартирой 87. Аварийная бригада выполнила временную герметизацию, основной ремонт назначен на завтра.",
                date_label="Вчера",
                icon="🏠",
                requires_attention=True,
            ),
            dict(
                event_type="good",
                severity="info",
                title="Открыли обновлённую детскую площадку",
                body="Установили безопасное покрытие, новые игровые элементы, освещение и лавочки. Площадка уже открыта для жителей.",
                date_label="2 часа назад",
                icon="🌿",
                requires_attention=False,
            ),
            dict(
                event_type="useful",
                severity="info",
                title="Проверка пожарной сигнализации",
                body="В четверг с 11:00 до 13:00 подрядчик проверит датчики и систему оповещения. Кратковременный звуковой сигнал является частью проверки.",
                date_label="Сегодня",
                icon="🛡️",
                requires_attention=False,
            ),
        ],
    }

    for address, event_items in event_seeds.items():
        building = building_by_address[address]
        result = await db.execute(
            select(BuildingEvent).where(BuildingEvent.building_id == building.id)
        )
        if not result.scalars().first():
            for item in event_items:
                db.add(BuildingEvent(building_id=building.id, **item))

    # По одной понятной показательной проблеме на каждый демо-дом.
    request_seeds = {
        "ул. Пушкина, 7": dict(
            resident_id=collective_reporter.id,
            category="Общее имущество",
            description="Сломана входная дверь в подъезде № 1",
            status="IN_PROGRESS",
        ),
        "проспект Мира, 24": dict(
            resident_id=demo_user.id,
            category="Лифт",
            description="Не работает пассажирский лифт во втором подъезде",
            status="ACCEPTED",
        ),
        "ул. Ленина, 18": dict(
            resident_id=demo_user.id,
            category="Кровля",
            description="Протечка кровли над квартирой 87",
            status="WAITING",
        ),
    }

    for address, request_item in request_seeds.items():
        building = building_by_address[address]
        request_result = await db.execute(
            select(Request).where(Request.building_id == building.id)
        )
        if not request_result.scalars().first():
            db.add(Request(building_id=building.id, **request_item))

    await db.commit()
