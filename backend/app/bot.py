import asyncio
import sys
from collections.abc import Sequence

import httpx
import truststore
from sqlalchemy import select

from app.config import settings
from app.db import SessionLocal
from app.models import (
    Building,
    BuildingEvent,
    BuildingProfile,
    Meter,
    MiniAppRegistration,
    Repair,
    Request,
    ResidentBuilding,
    ResidentBuildingMeta,
    User,
)

# На Windows MAX должен использовать системное хранилище сертификатов.
# В Linux-контейнере httpx использует свой актуальный набор CA (certifi).
if sys.platform == "win32":
    truststore.inject_into_ssl()


API_URL = settings.max_api_url.rstrip("/")
MY_HOME_MINI_APP_URL = settings.mini_app_url
GOSUSLUGI_DOM_BOT_URL = "https://max.ru/gosuslugi_dom_bot"

REQUEST_CATEGORIES = {
    "water": "Водоснабжение",
    "heating": "Отопление",
    "electricity": "Электричество",
    "elevator": "Лифт",
    "cleaning": "Уборка",
    "trash": "Мусор",
    "yard": "Двор",
    "intercom": "Домофон",
    "repair": "Ремонт",
    "other": "Другое",
}

STATUS_LABELS = {
    "NEW": "Новая",
    "IN_PROGRESS": "В работе",
    "DONE": "Выполнена",
    "CLOSED": "Закрыта",
}

REPAIR_STATUS_LABELS = {
    "PLANNED": "Запланировано",
    "IN_PROGRESS": "В работе",
    "DONE": "Выполнено",
}

# Для локального прототипа достаточно состояния в памяти процесса.
user_sessions: dict[int, dict[str, object]] = {}


def headers():
    return {
        "Authorization": settings.max_bot_token,
        "Content-Type": "application/json",
    }


def callback_button(text: str, payload: str) -> dict:
    return {"type": "callback", "text": text, "payload": payload}


def link_button(text: str, url: str) -> dict:
    return {"type": "link", "text": text, "url": url}


def keyboard(rows: Sequence[Sequence[dict]]) -> list[dict]:
    return [
        {
            "type": "inline_keyboard",
            "payload": {"buttons": [list(row) for row in rows]},
        }
    ]


async def send_message(
    user_id: int,
    text: str,
    rows: Sequence[Sequence[dict]] | None = None,
):
    message: dict[str, object] = {"text": text}
    if rows:
        message["attachments"] = keyboard(rows)

    async with httpx.AsyncClient(verify=False) as client:
        response = await client.post(
            f"{API_URL}/messages",
            params={"user_id": user_id},
            headers=headers(),
            json=message,
            timeout=30,
        )

    print("Отправка сообщения:", response.status_code)
    if response.status_code >= 400:
        print(response.text)


async def send_main_menu(user_id: int):
    """Отправляет главное меню пользователю."""
    if not await is_registered(user_id):
        await send_registration_prompt(user_id)
        return

    await send_message(
        user_id,
        (
            "🏠 Добро пожаловать в «Мой дом»!\n\n"
            "Здесь вы можете взаимодействовать со своим домом "
            "и управляющей компанией прямо через MAX.\n\n"
            "Выберите нужный раздел 👇"
        ),
        [
            [link_button("🏠 Мой дом", MY_HOME_MINI_APP_URL)],
            [link_button("🏛 Госуслуги Дом", GOSUSLUGI_DOM_BOT_URL)],
            [callback_button("✍️ Оставить заявку", "request_start")],
            [
                callback_button("📊 Сводка по дому", "summary_start"),
                callback_button("📋 Мои заявки", "my_requests"),
            ],
        ],
    )


async def send_registration_prompt(user_id: int):
    await send_message(
        user_id,
        (
            "🔐 Сначала зарегистрируйтесь в Mini App «Мой дом».\n\n"
            "Регистрация пока формальная и займёт меньше минуты. "
            "После неё здесь откроются заявки, сводки и остальные кнопки."
        ),
        [[callback_button("Зарегистрироваться", "register_bot")]],
    )


async def send_registration_news_later(user_id: int) -> None:
    """Через минуту после регистрации присылает актуальную новость дома."""
    await asyncio.sleep(60)

    async with SessionLocal() as session:
        resident = await get_registered_resident(session, user_id)
        if resident is None:
            return

        event_row = (
            await session.execute(
                select(BuildingEvent, Building.address)
                .join(Building, Building.id == BuildingEvent.building_id)
                .join(
                    ResidentBuilding,
                    ResidentBuilding.building_id == Building.id,
                )
                .where(
                    ResidentBuilding.user_id == resident.id,
                    BuildingEvent.date_label == "Сегодня",
                )
                .order_by(BuildingEvent.id.desc())
                .limit(1)
            )
        ).first()

    if event_row is None:
        return

    event, address = event_row
    await send_message(
        user_id,
        (
            "📰 Новость вашего дома на сегодня\n\n"
            f"🏠 {address}\n"
            f"{event.title}\n\n"
            f"{event.body}"
        ),
        [[link_button("Открыть дом", MY_HOME_MINI_APP_URL)]],
    )


async def register_bot_user(user_id: int, max_user: dict) -> None:
    """Формально регистрирует пользователя прямо из диалога с ботом."""
    max_id = str(user_id)
    async with SessionLocal() as session:
        registration = await session.scalar(
            select(MiniAppRegistration).where(
                MiniAppRegistration.max_user_id == max_id
            )
        )
        if registration is not None:
            await send_message(
                user_id,
                "Спасибо, что вы зарегистрировались!",
                [[link_button("🏠 Открыть Мой дом", MY_HOME_MINI_APP_URL)]],
            )
            return

        resident = await session.scalar(
            select(User).where(User.max_user_id == max_id)
        )
        if resident is None:
            resident = User(
                max_user_id=max_id,
                first_name=str(max_user.get("first_name") or "Пользователь"),
                last_name=str(max_user.get("last_name") or ""),
                role="resident",
            )
            session.add(resident)
            await session.flush()

        session.add(
            MiniAppRegistration(
                max_user_id=max_id,
                user_id=resident.id,
                auth_provider="max_bot",
            )
        )

        default_homes = {
            "ул. Пушкина, 7": "45",
            "проспект Мира, 24": "8",
            "ул. Ленина, 18": "12",
        }
        buildings = list(
            (
                await session.scalars(
                    select(Building).where(Building.address.in_(default_homes))
                )
            ).all()
        )
        for building in buildings:
            link = await session.scalar(
                select(ResidentBuilding).where(
                    ResidentBuilding.user_id == resident.id,
                    ResidentBuilding.building_id == building.id,
                )
            )
            if link is None:
                session.add(
                    ResidentBuilding(
                        user_id=resident.id,
                        building_id=building.id,
                        apartment_number=default_homes[building.address],
                        verified=True,
                    )
                )

            meta = await session.scalar(
                select(ResidentBuildingMeta).where(
                    ResidentBuildingMeta.user_id == resident.id,
                    ResidentBuildingMeta.building_id == building.id,
                )
            )
            if meta is None:
                session.add(
                    ResidentBuildingMeta(
                        user_id=resident.id,
                        building_id=building.id,
                        relation="owner",
                    )
                )

        await session.commit()

    await send_message(
        user_id,
        "Спасибо, что вы зарегистрировались!",
        [[link_button("🏠 Открыть Мой дом", MY_HOME_MINI_APP_URL)]],
    )
    asyncio.create_task(send_registration_news_later(user_id))


async def get_registered_resident(session, max_user_id: int) -> User | None:
    return await session.scalar(
        select(User)
        .join(MiniAppRegistration, MiniAppRegistration.user_id == User.id)
        .where(MiniAppRegistration.max_user_id == str(max_user_id))
    )


async def is_registered(max_user_id: int) -> bool:
    async with SessionLocal() as session:
        registration = await session.scalar(
            select(MiniAppRegistration.id).where(
                MiniAppRegistration.max_user_id == str(max_user_id)
            )
        )
        return registration is not None


async def get_resident_houses(session, resident_id: int) -> list[Building]:
    result = await session.scalars(
        select(Building)
        .distinct()
        .join(ResidentBuilding, ResidentBuilding.building_id == Building.id)
        .where(ResidentBuilding.user_id == resident_id)
        .order_by(Building.id)
    )
    return list(result.all())


async def get_bot_context(max_user_id: int) -> tuple[User | None, list[Building]]:
    async with SessionLocal() as session:
        resident = await get_registered_resident(session, max_user_id)
        if resident is None:
            return None, []
        houses = await get_resident_houses(session, resident.id)
        return resident, houses


def house_rows(houses: Sequence[Building], prefix: str) -> list[list[dict]]:
    rows = [
        [callback_button(f"🏠 {house.address}", f"{prefix}:{house.id}")]
        for house in houses
    ]
    rows.append([callback_button("← Главное меню", "main_menu")])
    return rows


async def send_house_choice(user_id: int, flow: str):
    _, houses = await get_bot_context(user_id)
    if not houses:
        await send_message(
            user_id,
            "Не удалось найти добавленные дома. Откройте «Мой дом» и добавьте дом.",
            [[link_button("🏠 Открыть Мой дом", MY_HOME_MINI_APP_URL)]],
        )
        return

    if flow == "request":
        text = "✍️ Для какого дома вы хотите оставить заявку?"
        prefix = "request_house"
    else:
        text = "📊 По какому дому показать сводку?"
        prefix = "summary_house"

    await send_message(user_id, text, house_rows(houses, prefix))


async def choose_request_category(user_id: int, building_id: int):
    async with SessionLocal() as session:
        house = await session.get(Building, building_id)
    if house is None:
        await send_message(user_id, "Дом не найден. Попробуйте выбрать его ещё раз.")
        return

    user_sessions[user_id] = {
        "flow": "request",
        "stage": "category",
        "building_id": building_id,
    }

    buttons = [
        callback_button(label, f"request_category:{slug}")
        for slug, label in REQUEST_CATEGORIES.items()
    ]
    rows = [buttons[index : index + 2] for index in range(0, len(buttons), 2)]
    rows.append([callback_button("← Выбрать другой дом", "request_start")])
    await send_message(
        user_id,
        f"🏠 {house.address}\n\nВыберите категорию заявки:",
        rows,
    )


async def choose_request_description(user_id: int, category_slug: str):
    state = user_sessions.get(user_id)
    category = REQUEST_CATEGORIES.get(category_slug)
    if not state or state.get("flow") != "request" or not category:
        await send_house_choice(user_id, "request")
        return

    state["stage"] = "description"
    state["category"] = category
    await send_message(
        user_id,
        (
            f"Выбрано: {category}.\n\n"
            "Опишите проблему одним сообщением. Например: "
            "«Не работает свет на лестничной площадке»."
        ),
        [[callback_button("Отмена", "main_menu")]],
    )


async def create_request_from_message(user_id: int, description: str):
    state = user_sessions.get(user_id)
    if not state:
        await send_main_menu(user_id)
        return

    building_id = int(state["building_id"])
    category = str(state["category"])

    async with SessionLocal() as session:
        resident = await get_registered_resident(session, user_id)
        house = await session.get(Building, building_id)
        if resident is None or house is None:
            user_sessions.pop(user_id, None)
            await send_message(user_id, "Не удалось создать заявку. Попробуйте ещё раз.")
            return

        request = Request(
            resident_id=resident.id,
            building_id=building_id,
            category=category,
            description=description.strip(),
            status="NEW",
        )
        session.add(request)
        await session.commit()
        await session.refresh(request)

    user_sessions.pop(user_id, None)
    await send_message(
        user_id,
        (
            f"✅ Заявка №{request.id} создана и добавлена в приложение.\n\n"
            f"Дом: {house.address}\n"
            f"Категория: {category}\n"
            f"Описание: {description.strip()}\n"
            "Статус: Новая"
        ),
        [
            [link_button("🏠 Открыть Мой дом", MY_HOME_MINI_APP_URL)],
            [
                callback_button("📋 Мои заявки", "my_requests"),
                callback_button("✍️ Ещё заявка", "request_start"),
            ],
        ],
    )


async def send_my_requests(user_id: int):
    async with SessionLocal() as session:
        resident = await get_registered_resident(session, user_id)
        if resident is None:
            requests = []
            houses = {}
        else:
            request_rows = await session.scalars(
                select(Request)
                .where(Request.resident_id == resident.id)
                .order_by(Request.created_at.desc())
                .limit(8)
            )
            requests = list(request_rows.all())
            house_ids = {request.building_id for request in requests}
            if house_ids:
                building_rows = await session.scalars(
                    select(Building).where(Building.id.in_(house_ids))
                )
                houses = {house.id: house for house in building_rows.all()}
            else:
                houses = {}

    if requests:
        lines = ["📋 Ваши последние заявки:"]
        for request in requests:
            address = houses.get(request.building_id)
            lines.append(
                f"\n№{request.id} · {STATUS_LABELS.get(request.status, request.status)}\n"
                f"{address.address if address else 'Дом'} · {request.category}\n"
                f"{request.description}"
            )
        text = "\n".join(lines)
    else:
        text = "📋 У вас пока нет заявок."

    await send_message(
        user_id,
        text,
        [
            [callback_button("✍️ Оставить заявку", "request_start")],
            [
                link_button("🏠 Открыть Мой дом", MY_HOME_MINI_APP_URL),
                callback_button("← Меню", "main_menu"),
            ],
        ],
    )


async def send_summary_sections(user_id: int, building_id: int):
    async with SessionLocal() as session:
        house = await session.get(Building, building_id)
    if house is None:
        await send_house_choice(user_id, "summary")
        return

    await send_message(
        user_id,
        f"📊 Сводка по дому\n{house.address}\n\nЧто вас интересует?",
        [
            [
                callback_button("🛠 ЖКХ", f"summary:{building_id}:utilities"),
                callback_button("🧾 Квитанции", f"summary:{building_id}:receipts"),
            ],
            [
                callback_button("🏗 Работы", f"summary:{building_id}:repairs"),
                callback_button("☎️ Контакты", f"summary:{building_id}:contacts"),
            ],
            [callback_button("← Выбрать другой дом", "summary_start")],
        ],
    )


async def build_summary(building_id: int, section: str) -> str | None:
    async with SessionLocal() as session:
        house = await session.get(Building, building_id)
        if house is None:
            return None

        if section == "utilities":
            request_rows = await session.scalars(
                select(Request)
                .where(
                    Request.building_id == building_id,
                    Request.status.in_(["NEW", "IN_PROGRESS"]),
                )
                .order_by(Request.created_at.desc())
                .limit(4)
            )
            active_requests = list(request_rows.all())
            meter_rows = await session.scalars(
                select(Meter)
                .where(Meter.building_id == building_id)
                .order_by(Meter.id)
            )
            meters = list(meter_rows.all())
            lines = [f"🛠 ЖКХ · {house.address}"]
            if active_requests:
                lines.append(f"\nОткрытых заявок: {len(active_requests)}")
                lines.extend(
                    f"• {item.category}: {item.description} — "
                    f"{STATUS_LABELS.get(item.status, item.status)}"
                    for item in active_requests
                )
            else:
                lines.append("\nОткрытых заявок нет.")
            required = [meter.name for meter in meters if meter.submission_required]
            lines.append(
                "\nПередать показания: "
                + (", ".join(required) if required else "сейчас не требуется")
            )
            return "\n".join(lines)

        if section == "receipts":
            return (
                f"🧾 Квитанции · {house.address}\n\n"
                "Текущая квитанция: 4 860 ₽\n"
                "Оплатить до: 10 октября\n"
                "Предыдущий месяц: оплачено\n\n"
                "Подробная история и оплата доступны в приложении."
            )

        if section == "repairs":
            repair_rows = await session.scalars(
                select(Repair)
                .where(Repair.building_id == building_id)
                .order_by(Repair.year.desc(), Repair.id.desc())
                .limit(6)
            )
            repairs = list(repair_rows.all())
            lines = [f"🏗 Работы · {house.address}"]
            if repairs:
                lines.extend(
                    f"\n• {repair.title} — "
                    f"{REPAIR_STATUS_LABELS.get(repair.status, repair.status)}"
                    for repair in repairs
                )
            else:
                lines.append("\nЗапланированных работ пока нет.")
            return "".join(lines)

        if section == "contacts":
            profile = await session.get(BuildingProfile, building_id)
            company = profile.company if profile and profile.company else "УК «Уютный дом»"
            emergency = (
                profile.emergency_phone
                if profile and profile.emergency_phone
                else "+7 (495) 123-45-67"
            )
            return (
                f"☎️ Контакты · {house.address}\n\n"
                f"{company}\n"
                f"Аварийная служба: {emergency} (круглосуточно)\n"
                "Сантехническая служба: +7 (495) 784-31-09\n"
                "Дежурный электрик: +7 (495) 326-18-44\n"
                "Лифтовая служба: +7 (495) 642-20-17\n"
                "Почта УК: help@uyut-dom.example"
            )

    return None


async def send_summary(user_id: int, building_id: int, section: str):
    text = await build_summary(building_id, section)
    if text is None:
        await send_summary_sections(user_id, building_id)
        return

    await send_message(
        user_id,
        text,
        [
            [callback_button("← Разделы сводки", f"summary_house:{building_id}")],
            [
                callback_button("🏠 Другой дом", "summary_start"),
                link_button("Открыть приложение", MY_HOME_MINI_APP_URL),
            ],
        ],
    )


def get_message_text(message: dict) -> str:
    body = message.get("body") or {}
    return str(body.get("text") or message.get("text") or "").strip()


async def handle_update(update: dict):
    update_type = update.get("update_type")
    print("Получено событие:", update_type)

    if update_type == "bot_started":
        user = update.get("user", {})
        user_id = user.get("user_id")
        if user_id:
            user_sessions.pop(int(user_id), None)
            await send_main_menu(int(user_id))
        return

    if update_type == "message_created":
        message = update.get("message", {})
        sender = message.get("sender", {})
        user_id = sender.get("user_id")
        if not user_id:
            return

        user_id = int(user_id)
        text = get_message_text(message)
        state = user_sessions.get(user_id)
        if state and state.get("stage") == "description" and text:
            await create_request_from_message(user_id, text)
        else:
            await send_main_menu(user_id)
        return

    if update_type != "message_callback":
        return

    callback = update.get("callback", {})
    payload = str(callback.get("payload") or "")
    user = callback.get("user", {}) or update.get("user", {})
    user_id = user.get("user_id")
    if not user_id:
        return
    user_id = int(user_id)

    if payload == "register_bot":
        user_sessions.pop(user_id, None)
        await register_bot_user(user_id, user)
        return

    if not await is_registered(user_id):
        user_sessions.pop(user_id, None)
        await send_registration_prompt(user_id)
        return

    if payload == "main_menu":
        user_sessions.pop(user_id, None)
        await send_main_menu(user_id)
    elif payload == "request_start":
        user_sessions.pop(user_id, None)
        await send_house_choice(user_id, "request")
    elif payload.startswith("request_house:"):
        await choose_request_category(user_id, int(payload.split(":", 1)[1]))
    elif payload.startswith("request_category:"):
        await choose_request_description(user_id, payload.split(":", 1)[1])
    elif payload == "my_requests":
        await send_my_requests(user_id)
    elif payload == "summary_start":
        await send_house_choice(user_id, "summary")
    elif payload.startswith("summary_house:"):
        await send_summary_sections(user_id, int(payload.split(":", 1)[1]))
    elif payload.startswith("summary:"):
        _, building_id, section = payload.split(":", 2)
        await send_summary(user_id, int(building_id), section)
    else:
        await send_main_menu(user_id)


async def main():
    if not settings.max_bot_token:
        print("❌ MAX_BOT_TOKEN не найден.")
        print("Проверь файл backend/.env")
        return

    print("🤖 Бот «Мой дом» запускается...")
    print("Ожидаю сообщения из MAX...")
    marker = None

    async with httpx.AsyncClient(verify=False) as client:
        while True:
            try:
                params = {
                    "timeout": 30,
                    "limit": 100,
                    "types": "bot_started,message_created,message_callback",
                }
                if marker is not None:
                    params["marker"] = marker

                response = await client.get(
                    f"{API_URL}/updates",
                    params=params,
                    headers=headers(),
                    timeout=40,
                )
                if response.status_code != 200:
                    print("❌ Ошибка MAX:", response.status_code, response.text)
                    await asyncio.sleep(5)
                    continue

                data = response.json()
                marker = data.get("marker", marker)
                for update in data.get("updates", []):
                    await handle_update(update)
            except Exception as error:
                print("❌ Ошибка:", error)
                await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
