import React from "react";

import {
  formatShortDate,
  isActiveRequest,
} from "../domain/houseState";
import type { House } from "../types";

export default function HouseCard({
  house,
  onClick,
  pinned = false,
}: {
  house: House;
  onClick: () => void;
  pinned?: boolean;
}) {
  const metersToSubmit =
    house.meters.filter(
      (meter) =>
        meter.submissionRequired
    );

  const earliestMeter =
    metersToSubmit[0];

  const meterText =
    metersToSubmit.length > 0
      ? earliestMeter
          ?.nextSubmissionDate
        ? `до ${formatShortDate(
            earliestMeter.nextSubmissionDate
          )}`
        : "нужно передать"
      : "переданы";

  const activeRequests =
    house.requests.filter(
      isActiveRequest
    ).length;

  const currentRequest = house.requests.find(isActiveRequest);
  const demoStageByHouse: Record<number, string> = {
    1: "NEW",
    2: "ACCEPTED",
    3: "IN_PROGRESS",
    5: "WAITING",
    9: "DONE",
  };
  const requestStage = currentRequest?.status || demoStageByHouse[house.id];
  const requestStageView: Record<
    string,
    { tone: string }
  > = {
    NEW: { tone: "critical" },
    ACCEPTED: { tone: "warning" },
    IN_PROGRESS: { tone: "progress" },
    WAITING: { tone: "waiting" },
    DONE: { tone: "success" },
  };
  const requestStageBadge = requestStage
    ? requestStageView[requestStage]
    : undefined;

  const activeEvent =
    house.events.find(
      (event) =>
        !event.resolved &&
        (event.severity === "urgent" ||
          event.requiresAttention ||
          event.severity ===
            "attention")
    );

  const demoProblemByHouse: Record<number, string> = {
    2: "Не работает домофон",
    3: "Нет света на этаже",
  };
  const problemText =
    currentRequest?.description ||
    activeEvent?.title ||
    demoProblemByHouse[house.id] ||
    "Обращение по дому";

  return (
    <button
      className="houseCard"
      onClick={onClick}
    >
      <div className="houseThumb">
        {house.image ? (
          <img
            src={house.image}
            alt=""
            loading="lazy"
          />
        ) : (
          "🏢"
        )}
      </div>

      <div className="houseMain">
        <div className="houseTitle">
          <b>{house.address}</b>
          <span className="houseTitleActions">
            {requestStageBadge && (
              <span
                className={`houseProblemPill houseProblemPill-${requestStageBadge.tone}`}
                title={problemText}
              >
                {problemText}
              </span>
            )}
            {pinned && (
              <span className="housePinnedMark" aria-label="Дом закреплён">
                📌
              </span>
            )}
          </span>
        </div>

        <div className="houseStatusLine">
          {house.apartment ? (
            <small>
              Квартира{" "}
              {house.apartment}
            </small>
          ) : (
            <small>{house.company}</small>
          )}

        </div>

        <div className="miniStats">
          <span>
            <span className="miniStatText">
              Показания
              <small>{meterText}</small>
            </span>
            <i>💧</i>
          </span>

          <span>
            <span className="miniStatText">
              Заявки
              <small>
                {activeRequests > 0
                  ? `${activeRequests} ${
                      activeRequests === 1 ? "активная" : "активные"
                    }`
                  : "Нет новых"}
              </small>
            </span>
            <i>🔧</i>
          </span>

          <span>
            <span className="miniStatText">
              Новости
              <small>{activeEvent ? activeEvent.title : "Новых нет"}</small>
            </span>
            <i>▤</i>
          </span>
        </div>
      </div>

      <b className="chev">›</b>
    </button>
  );
}
