import React, {
  useMemo,
  useState,
} from "react";

import HouseCard from "../components/HouseCard";
import { IconBell } from "../components/UI";
import {
  isActiveRequest,
} from "../domain/houseState";
import {
  useHouseStore,
} from "../state/HouseStore";
import type {
  HouseTab,
  Screen,
  User,
} from "../types";

type SummaryType =
  | "urgent"
  | "todo"
  | "news"
  | "requests";

type SummaryItem = {
  id: string;
  icon: string;
  title: string;
  text: string;
  meta: string;
  onOpen: () => void;
};

export default function HomePage({
  go,
  selectHouse,
  selectEvent,
  user,
}: {
  go: (screen: Screen) => void;
  selectHouse: (
    id: number,
    tab?: HouseTab
  ) => void;
  selectEvent: (id: number) => void;
  user: User | null;
}) {
  const {
    myHouses,
    loading,
    pinnedHouseIds,
  } = useHouseStore();

  const [
    activeSummary,
    setActiveSummary,
  ] = useState<SummaryType | null>(
    () => {
      const saved =
        sessionStorage.getItem(
          "activeHomeSummary"
        );

      if (
        saved === "urgent" ||
        saved === "todo" ||
        saved === "news" ||
        saved === "requests"
      ) {
        return saved;
      }

      return null;
    }
  );

  const [dismissedEvents, setDismissedEvents] = useState<Set<number>>(
    () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("dismissedImportantCardsV1") || "[]"
        );

        return new Set(
          Array.isArray(saved)
            ? saved.map(Number).filter(Number.isFinite)
            : []
        );
      } catch {
        return new Set();
      }
    }
  );

  function dismissEventCard(eventId: number) {
    setDismissedEvents((current) => {
      const next = new Set(current);
      next.add(eventId);
      localStorage.setItem(
        "dismissedImportantCardsV1",
        JSON.stringify([...next])
      );
      return next;
    });
  }

  const data = useMemo(() => {
    const important: SummaryItem[] =
      [];
    const todo: SummaryItem[] = [];
    const news: SummaryItem[] = [];
    const requests: SummaryItem[] =
      [];

    const attentionEvents: {
      houseId: number;
      address: string;
      eventId: number;
      icon: string;
      title: string;
      body: string;
      date: string;
      severity: string;
    }[] = [];

    myHouses.forEach((house) => {
      house.events.forEach(
        (event) => {
          if (
            event.severity ===
              "urgent" ||
            event.severity ===
              "attention" ||
            event.requiresAttention
          ) {
            important.push({
              id: `event-${event.id}`,
              icon:
                event.icon || "!",
              title: event.title,
              text: event.body,
              meta: `${house.address} · ${event.date}`,
              onOpen: () =>
                selectEvent(
                  event.id
                ),
            });

            attentionEvents.push({
              houseId: house.id,
              address:
                house.address,
              eventId: event.id,
              icon:
                event.icon || "!",
              title: event.title,
              body: event.body,
              date: event.date,
              severity:
                event.severity,
            });
          } else {
            news.push({
              id: `news-${event.id}`,
              icon:
                event.icon || "▤",
              title: event.title,
              text: event.body,
              meta: `${house.address} · ${event.date}`,
              onOpen: () =>
                selectEvent(
                  event.id
                ),
            });
          }
        }
      );

      house.meters
        .filter(
          (meter) =>
            meter.submissionRequired
        )
        .forEach((meter) => {
          todo.push({
            id: `meter-${meter.id}`,
            icon: "💧",
            title:
              "Передать показания",
            text: `${meter.name}: последние показания ${meter.lastValue} ${meter.unit}.`,
            meta: house.address,
            onOpen: () =>
              selectHouse(
                house.id,
                "Счётчики"
              ),
          });
        });

      house.requests
        .filter(isActiveRequest)
        .forEach((request) => {
          requests.push({
            id: `request-${request.id}`,
            icon: "🔧",
            title:
              request.description,
            text: `${request.category} · ${request.status}`,
            meta: house.address,
            onOpen: () =>
              selectHouse(
                house.id,
                "Заявки"
              ),
          });
        });
    });

    if (myHouses[0]) {
      const mainHouse = myHouses[0];

      todo.unshift(
        {
          id: "todo-receipt",
          icon: "₽",
          title: "Проверить квитанцию за сентябрь",
          text: "Начисления уже доступны в разделе финансов.",
          meta: `${mainHouse.address} · до 10 октября`,
          onOpen: () => selectHouse(mainHouse.id, "Счётчики"),
        },
        {
          id: "todo-door",
          icon: "🚪",
          title: "Поддержать заявку на ремонт двери",
          text: "Коллективная заявка быстрее попадёт в работу.",
          meta: mainHouse.address,
          onOpen: () => selectHouse(mainHouse.id, "Заявки"),
        }
      );
    }

    return {
      important,
      todo,
      news,
      requests,
      attentionEvents,
    };
  }, [
    myHouses,
    selectEvent,
    selectHouse,
  ]);

  const summaryItems: Record<
    SummaryType,
    SummaryItem[]
  > = {
    urgent: data.important,
    todo: data.todo,
    news: data.news,
    requests: data.requests,
  };

  const visibleAttentionEvents = data.attentionEvents.filter(
    (item) => !dismissedEvents.has(item.eventId)
  );

  function toggleSummary(
    type: SummaryType
  ) {
    setActiveSummary((current) => {
      const next =
        current === type
          ? null
          : type;

      if (next) {
        sessionStorage.setItem(
          "activeHomeSummary",
          next
        );
      } else {
        sessionStorage.removeItem(
          "activeHomeSummary"
        );
      }

      return next;
    });
  }

  return (
    <>
      <header className="pageHeader">
        <h1>Мой дом</h1>

        <div>
          <button
            className="iconBtn notify"
            onClick={() =>
              go("notifications")
            }
          >
            <IconBell />
            <i />
          </button>

          <button
            className="avatar"
            onClick={() =>
              go("profile")
            }
          >
            👤
          </button>
        </div>
      </header>

      <section className="welcome welcomeCompact">
        <div className="welcomeText">
          <b>
            Здравствуйте!
          </b>
          <p>
            Всё важное по вашему дому —
            здесь.
          </p>
        </div>
      </section>

      <section className="summary">
        <SummaryButton
          className="danger"
          active={
            activeSummary === "urgent"
          }
          icon="!"
          title={
            <>
              Важные
              <br />
              события
            </>
          }
          onClick={() =>
            toggleSummary("urgent")
          }
        />

        <SummaryButton
          className="warn"
          active={
            activeSummary === "todo"
          }
          icon="◷"
          title={
            <>
              Нужно
              <br />
              сделать
            </>
          }
          onClick={() =>
            toggleSummary("todo")
          }
        />

        <SummaryButton
          className="info"
          active={
            activeSummary === "news"
          }
          icon="▤"
          title={
            <>
              Новости
            </>
          }
          onClick={() =>
            toggleSummary("news")
          }
        />

        <SummaryButton
          className="requests"
          active={
            activeSummary ===
            "requests"
          }
          icon="✓"
          title={
            <>
              Мои
              <br />
              заявки
            </>
          }
          onClick={() =>
            toggleSummary(
              "requests"
            )
          }
        />
      </section>

      {activeSummary && (
        <section
          className={`summaryDetails summaryDetails-${activeSummary}`}
        >
          <div className="summaryDetailsHeader">
            <b>
              {activeSummary ===
                "urgent" &&
                "Важные события"}
              {activeSummary ===
                "todo" &&
                "Нужно сделать"}
              {activeSummary ===
                "news" &&
                "Новости"}
              {activeSummary ===
                "requests" &&
                "Мои заявки"}
            </b>

            <button
              onClick={() => {
                setActiveSummary(null);
                sessionStorage.removeItem(
                  "activeHomeSummary"
                );
              }}
              aria-label="Закрыть"
            >
              ×
            </button>
          </div>

          <div className="summaryDetailsList">
            {summaryItems[
              activeSummary
            ].length > 0 ? (
              summaryItems[
                activeSummary
              ].map((item) => (
                <div
                  className="summaryDetailItem"
                  key={item.id}
                >
                  <button
                    className="summaryDetailMain"
                    onClick={item.onOpen}
                  >
                    <span className="summaryDetailIcon">
                      {item.icon}
                    </span>

                    <div>
                      <small>{item.meta}</small>
                      <b>{item.title}</b>
                      <p>{item.text}</p>
                    </div>

                    {activeSummary !== "urgent" && (
                      <strong>›</strong>
                    )}
                  </button>

                </div>
              ))
            ) : (
              <div className="summaryEmpty">
                Здесь пока ничего нет
              </div>
            )}
          </div>
        </section>
      )}

      {visibleAttentionEvents.length >
        0 && (
        <section className="urgentSection">
          <div className="urgentSlider">
            {visibleAttentionEvents.map(
              (item) => (
                <article
                  className={`urgentSlide ${
                    item.severity ===
                    "urgent"
                      ? "isUrgent"
                      : ""
                  }`}
                  key={item.eventId}
                >
                  <button
                    className="urgentSlideMain"
                    onClick={() =>
                      selectEvent(item.eventId)
                    }
                  >
                  <div className="urgentIcon">
                    {item.icon}
                  </div>

                  <div className="urgentContent">
                    <small>
                      {item.severity ===
                      "urgent"
                        ? "Срочно"
                        : "Важно"}{" "}
                      · {item.date}
                    </small>

                    <b>
                      {item.address}
                    </b>

                    <p>
                      {item.title}
                    </p>
                  </div>

                  </button>

                  <button
                    className="dismissUrgent"
                    aria-label="Закрыть уведомление"
                    title="Закрыть уведомление"
                    onClick={() => dismissEventCard(item.eventId)}
                  >
                    ×
                  </button>

                </article>
              )
            )}
          </div>
        </section>
      )}

      <div className="sectionTitle">
        <h2>Мой дом</h2>

        <button
          className="pillBtn"
          onClick={() =>
            go("add-house")
          }
        >
          ＋ Добавить дом
        </button>
      </div>

      {loading &&
        myHouses.length === 0 && (
          <div className="empty">
            Загружаем дома…
          </div>
        )}

      <div className="houseList">
        {myHouses.map(
          (house) => (
            <HouseCard
              key={house.id}
              house={house}
              pinned={pinnedHouseIds.includes(house.id)}
              onClick={() =>
                selectHouse(
                  house.id
                )
              }
            />
          )
        )}
      </div>

      <button
        className="allEvents"
        onClick={() =>
          go("feed")
        }
      >
        <span>▤</span>

        <div>
          <b>
            Все события по дому
          </b>
          <small>
            Отключения, ремонты,
            собрания и другое
          </small>
        </div>

        <b>›</b>
      </button>
    </>
  );
}

function SummaryButton({
  className,
  active,
  icon,
  title,
  onClick,
}: {
  className: string;
  active: boolean;
  icon: string;
  title: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`summaryCard ${className} ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <b>{icon}</b>
      <span>{title}</span>
      <i className="summaryArrow">
        {active ? "⌃" : "⌄"}
      </i>
    </button>
  );
}
