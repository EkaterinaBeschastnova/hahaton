import type {
  House,
  HouseState,
  HouseStateReason,
  RequestItem,
} from "../types";

const ACTIVE_REQUEST_STATUSES = new Set([
  "NEW",
  "ACCEPTED",
  "IN_PROGRESS",
  "WAITING",
]);

const ACTIVE_REPAIR_STATUSES = new Set([
  "PLANNED",
  "IN_PROGRESS",
]);

export function isActiveRequest(request: RequestItem) {
  return ACTIVE_REQUEST_STATUSES.has(request.status);
}

/**
 * Единственная функция фронтенда, которая решает,
 * нужно ли дому состояние "срочно/требует внимания".
 *
 * Никаких status/statusText в базе дома больше нет.
 * Состояние всегда выводится из реальных дочерних данных дома.
 */
export function deriveHouseState(house: House): HouseState {
  const urgentReasons: HouseStateReason[] = [];
  const attentionReasons: HouseStateReason[] = [];

  house.events.forEach((event) => {
    if (event.resolved) {
      return;
    }

    const reason: HouseStateReason = {
      kind: "event",
      label: event.title,
      detail: event.body || "Событие по дому",
      sourceId: event.id,
    };

    if (event.severity === "urgent") {
      urgentReasons.push(reason);
      return;
    }

    if (
      event.severity === "attention" ||
      event.requiresAttention
    ) {
      attentionReasons.push(reason);
    }
  });

  house.meters.forEach((meter) => {
    if (!meter.submissionRequired) {
      return;
    }

    attentionReasons.push({
      kind: "meter",
      label: `Передать показания: ${meter.name}`,
      detail: meter.nextSubmissionDate
        ? `Передать до ${formatShortDate(
            meter.nextSubmissionDate
          )}`
        : "Показания ожидают передачи",
      sourceId: meter.id,
    });
  });

  house.requests.forEach((request) => {
    if (
      !isActiveRequest(request) ||
      request.isMine === false
    ) {
      return;
    }

    attentionReasons.push({
      kind: "request",
      label: request.description,
      detail: `Активная заявка · ${requestStatusText(
        request.status
      )}`,
      sourceId: request.id,
    });
  });

  house.repairs.forEach((repair) => {
    if (
      !ACTIVE_REPAIR_STATUSES.has(repair.status)
    ) {
      return;
    }

    const reason: HouseStateReason = {
      kind: "repair",
      label: repair.title,
      detail:
        repair.description ||
        "Работы по дому",
      sourceId: repair.id,
    };

    if (repair.severity === "urgent") {
      urgentReasons.push(reason);
      return;
    }

    if (repair.requiresAttention) {
      attentionReasons.push(reason);
    }
  });

  if (urgentReasons.length > 0) {
    return {
      level: "urgent",
      label: "Срочно",
      reasons: [
        ...urgentReasons,
        ...attentionReasons,
      ],
    };
  }

  if (attentionReasons.length > 0) {
    return {
      level: "attention",
      label: "Требует внимания",
      reasons: attentionReasons,
    };
  }

  return {
    level: null,
    label: null,
    reasons: [],
  };
}

export function getPrimaryHouseReason(
  house: House
): HouseStateReason | null {
  return deriveHouseState(house).reasons[0] || null;
}

export function requestStatusText(status: string) {
  if (status === "NEW") return "Новая";
  if (status === "ACCEPTED") return "Принята";
  if (status === "IN_PROGRESS") return "В работе";
  if (status === "WAITING") return "Ожидает";
  if (status === "DONE") return "Выполнена";
  if (status === "CANCELLED") return "Отменена";
  return status;
}

const REQUEST_STATUS_PRIORITY: Record<string, number> = {
  NEW: 0,
  ACCEPTED: 1,
  IN_PROGRESS: 2,
  WAITING: 3,
  CANCELLED: 4,
  DONE: 5,
};

/** Новые заявки сверху, завершённые всегда в конце. */
export function sortRequestsByPriority(
  requests: RequestItem[]
) {
  return [...requests].sort((left, right) => {
    const statusDifference =
      (REQUEST_STATUS_PRIORITY[left.status] ?? 4) -
      (REQUEST_STATUS_PRIORITY[right.status] ?? 4);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const leftDate = left.createdAt
      ? new Date(left.createdAt).getTime()
      : left.id;
    const rightDate = right.createdAt
      ? new Date(right.createdAt).getTime()
      : right.id;

    return rightDate - leftDate;
  });
}

export function formatShortDate(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}
