from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from app.models import BuildingEvent, Meter, Repair, Request


ACTIVE_REQUEST_STATUSES = {"NEW", "ACCEPTED", "IN_PROGRESS", "WAITING"}
ACTIVE_REPAIR_STATUSES = {"PLANNED", "IN_PROGRESS"}


@dataclass(slots=True)
class StateReason:
    kind: str
    label: str
    detail: str
    source_id: int | None = None

    def to_dict(self) -> dict:
        return {
            "kind": self.kind,
            "label": self.label,
            "detail": self.detail,
            "sourceId": self.source_id,
        }


def derive_building_state(
    *,
    events: Iterable[BuildingEvent],
    meters: Iterable[Meter],
    requests: Iterable[Request],
    repairs: Iterable[Repair],
) -> dict:
    """
    ЕДИНСТВЕННОЕ место, где вычисляется состояние дома.

    Состояние НЕ хранится отдельным полем у дома. Оно выводится из фактов:
    - срочные активные события -> urgent;
    - показания, которые пора передать -> attention;
    - плановые/важные отключения -> attention;
    - активные проблемы/заявки -> attention;
    - значимые ремонты -> attention;
    - если причин нет -> level=None, и интерфейс ничего не показывает.

    Это устраняет рассинхрон вида "у дома всё хорошо", когда внутри уже
    лежит отключение воды или просроченная передача показаний.
    """

    urgent_reasons: list[StateReason] = []
    attention_reasons: list[StateReason] = []

    for event in events:
        if event.resolved:
            continue

        if event.severity == "urgent":
            urgent_reasons.append(
                StateReason(
                    kind="event",
                    label=event.title,
                    detail=event.body or "Срочное событие по дому",
                    source_id=event.id,
                )
            )
        elif event.requires_attention or event.severity == "attention":
            attention_reasons.append(
                StateReason(
                    kind="event",
                    label=event.title,
                    detail=event.body or "Важное событие по дому",
                    source_id=event.id,
                )
            )

    for meter in meters:
        if meter.submission_required:
            attention_reasons.append(
                StateReason(
                    kind="meter",
                    label=f"Передать показания: {meter.name}",
                    detail=(
                        "Показания по прибору учёта ожидают передачи"
                        if not meter.next_submission_date
                        else f"Передать до {meter.next_submission_date.strftime('%d.%m')}"
                    ),
                    source_id=meter.id,
                )
            )

    for request in requests:
        if request.status in ACTIVE_REQUEST_STATUSES:
            attention_reasons.append(
                StateReason(
                    kind="request",
                    label=request.description,
                    detail=f"Заявка в статусе {request.status}",
                    source_id=request.id,
                )
            )

    for repair in repairs:
        if repair.status not in ACTIVE_REPAIR_STATUSES:
            continue

        reason = StateReason(
            kind="repair",
            label=repair.title,
            detail=repair.description or "Работы по дому",
            source_id=repair.id,
        )

        if repair.severity == "urgent":
            urgent_reasons.append(reason)
        elif repair.requires_attention:
            attention_reasons.append(reason)

    if urgent_reasons:
        reasons = urgent_reasons + attention_reasons
        return {
            "level": "urgent",
            "label": "Срочно",
            "reasons": [reason.to_dict() for reason in reasons],
        }

    if attention_reasons:
        return {
            "level": "attention",
            "label": "Требует внимания",
            "reasons": [reason.to_dict() for reason in attention_reasons],
        }

    return {
        "level": None,
        "label": None,
        "reasons": [],
    }
