import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import EventCard from "../components/EventCard";
import {
  BackHeader,
} from "../components/UI";
import {
  deriveHouseState,
  requestStatusText,
  sortRequestsByPriority,
} from "../domain/houseState";
import {
  useHouseStore,
} from "../state/HouseStore";
import type {
  House,
  HouseTab,
  MeterItem,
  RequestItem,
  Screen,
} from "../types";

export default function HousePage({
  id,
  initialTab,
  onTabChange,
  back,
  go,
  selectEvent,
}: {
  id: number;
  initialTab: HouseTab;
  onTabChange: (tab: HouseTab) => void;
  back: () => void;
  go: (screen: Screen) => void;
  selectEvent: (id: number) => void;
}) {
  const {
    getHouseById,
    submitMeter,
    createHousePost,
    resolveEvent,
    joinRequest,
    updateRequest,
    pinnedHouseIds,
    togglePinnedHouse,
    removeHouse,
  } = useHouseStore();

  const [houseMenuOpen, setHouseMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingHouse, setRemovingHouse] = useState(false);

  const house = getHouseById(id);

  const tab = initialTab;

  const tabsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  function selectTab(nextTab: HouseTab) {
    onTabChange(nextTab);
    window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      tabsRef.current
        ?.querySelector<HTMLButtonElement>(".active")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
    }, 0);
  }

  useEffect(() => {
    if (initialTab !== "События") {
      window.setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  }, [id, initialTab]);

  if (!house) {
    return (
      <>
        <BackHeader
          title="Дом"
          onBack={back}
        />

        <div className="empty houseNotFound">
          <b>Дом не найден</b>
          <p>
            В базе нет дома с ID{" "}
            {id}. Приложение больше не
            подставляет первый попавшийся
            адрес вместо выбранного.
          </p>
        </div>
      </>
    );
  }

  const state =
    deriveHouseState(house);

  const primaryReason =
    state.reasons[0];
  const isPinned = pinnedHouseIds.includes(house.id);

  return (
    <>
      <BackHeader
        title={house.address}
        onBack={back}
        action={
          <div className="houseMenuWrap">
            <button
              className="iconBtn"
              aria-label="Действия с домом"
              aria-expanded={houseMenuOpen}
              onClick={() => setHouseMenuOpen((open) => !open)}
            >
              •••
            </button>

            {houseMenuOpen && (
              <div className="houseMenu" role="menu">
                <button
                  role="menuitem"
                  onClick={() => {
                    togglePinnedHouse(house.id);
                    setHouseMenuOpen(false);
                  }}
                >
                  <span
                    className={`houseMenuPin${isPinned ? " isPinned" : ""}`}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M7 3h10l-1.5 7 3.5 4H5l3.5-4L7 3Z" />
                      <path d="M12 14v7" />
                    </svg>
                  </span>
                  <div>
                    <b>{isPinned ? "Открепить дом" : "Закрепить дом"}</b>
                    <small>
                      {isPinned
                        ? "Вернуть в обычный порядок"
                        : "Показывать первым в списке"}
                    </small>
                  </div>
                </button>

                <button
                  className="houseMenuDelete"
                  role="menuitem"
                  onClick={() => {
                    setHouseMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                >
                  <span>×</span>
                  <div>
                    <b>Удалить дом</b>
                    <small>Убрать из списка моих домов</small>
                  </div>
                </button>
              </div>
            )}
          </div>
        }
      />

      {confirmDelete && (
        <div className="houseDeleteOverlay" role="presentation">
          <div
            className="houseDeleteDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-house-title"
          >
            <span className="houseDeleteIcon">🏠</span>
            <h2 id="delete-house-title">Удалить дом?</h2>
            <p>
              {house.address} исчезнет из раздела «Мой дом». Его можно будет
              добавить снова.
            </p>
            <div>
              <button
                className="houseDeleteCancel"
                onClick={() => setConfirmDelete(false)}
                disabled={removingHouse}
              >
                Отмена
              </button>
              <button
                className="houseDeleteConfirm"
                disabled={removingHouse}
                onClick={async () => {
                  setRemovingHouse(true);
                  await removeHouse(house.id);
                  back();
                }}
              >
                {removingHouse ? "Удаляем…" : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="houseHero">
        <div className="houseHeroImg">
          {house.image ? (
            <img
              src={house.image}
              alt=""
            />
          ) : (
            "🏢"
          )}
        </div>

        <div className="overlay">
          <h1>
            {house.address}
          </h1>

          <p>
            г. {house.city}
            {house.district
              ? ` · ${house.district}`
              : ""}
          </p>

          {state.level &&
            primaryReason && (
              <div
                className={`houseHeroState houseHeroState-${state.level}`}
              >
                <b>
                  {state.label}
                </b>
                <span>
                  {
                    primaryReason.label
                  }
                </span>
              </div>
            )}
        </div>
      </section>

      <div className="facts">
        <span>
          <small>Квартира</small>
          <b>
            {house.apartment ||
              "—"}
          </b>
        </span>

        <span>
          <small>Год постройки</small>
          <b>{house.year}</b>
        </span>

        <span>
          <small>Этажей</small>
          <b>{house.floors}</b>
        </span>
      </div>

      <div className="quick">
        <button
          onClick={() =>
            selectTab("События")
          }
        >
          ▤
          <span>
            Все новости
            <br />
            по дому
          </span>
        </button>

        <button
          onClick={() =>
            selectTab("Счётчики")
          }
        >
          💧
          <span>
            Передать
            <br />
            показания
          </span>
        </button>

        <button
          onClick={() =>
            go("create-request")
          }
        >
          ＋
          <span>
            Создать
            <br />
            заявку
          </span>
        </button>

        <button
          onClick={() =>
            selectTab("Капремонт")
          }
        >
          🛠️
          <span>
            Работы
            <br />
            и ремонт
          </span>
        </button>

      </div>

      {state.reasons.length >
        0 && (
        <section className="houseReasons">
          <b>
            Что сейчас важно
          </b>

          {state.reasons.map(
            (reason, index) => (
              <div
                className="houseReasonRow"
                key={`${reason.kind}-${reason.sourceId}-${index}`}
              >
              <button
                className="houseReasonMain"
                onClick={() => {
                  if (
                    reason.kind ===
                    "meter"
                  ) {
                    selectTab(
                      "Счётчики"
                    );
                  }

                  if (
                    reason.kind ===
                    "request"
                  ) {
                    selectTab(
                      "Заявки"
                    );
                  }

                  if (
                    reason.kind ===
                    "repair"
                  ) {
                    selectTab(
                      "Капремонт"
                    );
                  }

                  if (
                    reason.kind ===
                      "event" &&
                    reason.sourceId
                  ) {
                    selectEvent(
                      reason.sourceId
                    );
                  }
                }}
              >
                <span>
                  {reason.kind ===
                  "meter"
                    ? "💧"
                    : reason.kind ===
                        "request"
                      ? "🔧"
                      : reason.kind ===
                          "repair"
                        ? "🛠️"
                        : "!"}
                </span>

                <div>
                  <b>
                    {reason.label}
                  </b>
                  <small>
                    {reason.detail}
                  </small>
                </div>

                <strong>
                  ›
                </strong>
              </button>

              {reason.kind === "event" && reason.sourceId && (
                <button
                  className="resolveCheck"
                  aria-label="Отметить решённым"
                  title="Отметить решённым"
                  onClick={() =>
                    void resolveEvent(house.id, reason.sourceId!)
                  }
                >
                  ✓
                </button>
              )}
              </div>
            )
          )}
        </section>
      )}

      <div className="houseTabsWrap" ref={sectionRef}>
        <button
          className="tabsArrow"
          aria-label="Предыдущие разделы"
          onClick={() =>
            tabsRef.current?.scrollBy({ left: -180, behavior: "smooth" })
          }
        >
          ‹
        </button>

      <div
        className="houseTabs"
        ref={tabsRef}
        onWheel={(event) => {
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.currentTarget.scrollLeft += event.deltaY;
          }
        }}
      >
        {(
          [
            "События",
            "Заявки",
            "Счётчики",
            "Капремонт",
            "О доме",
          ] as HouseTab[]
        ).map((item) => (
          <button
            className={
              tab === item
                ? "active"
                : ""
            }
            onClick={() =>
              selectTab(item)
            }
            key={item}
          >
            {item}
          </button>
        ))}
      </div>

        <button
          className="tabsArrow"
          aria-label="Следующие разделы"
          onClick={() =>
            tabsRef.current?.scrollBy({ left: 180, behavior: "smooth" })
          }
        >
          ›
        </button>
      </div>

      {tab === "События" && (
        <EventsTab
          house={house}
          selectEvent={selectEvent}
          createHousePost={createHousePost}
        />
      )}

      {tab === "Заявки" && (
        <RequestsTab
          house={house}
          createRequest={() =>
            go("create-request")
          }
          joinRequest={joinRequest}
          updateRequest={updateRequest}
        />
      )}

      {tab === "Счётчики" && (
        <MetersTab
          house={house}
          submitMeter={
            submitMeter
          }
        />
      )}

      {tab === "Капремонт" && (
        <RenovationTab
          house={house}
        />
      )}

      {tab === "О доме" && (
        <AboutTab
          house={house}
        />
      )}
    </>
  );
}

function EventsTab({
  house,
  selectEvent,
  createHousePost,
}: {
  house: House;
  selectEvent: (id: number) => void;
  createHousePost: (
    buildingId: number,
    title: string,
    body: string,
    postType: "announcement" | "work" | "good" | "useful",
    important: boolean
  ) => Promise<{ maxSent: number; maxFailed: number }>;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postType, setPostType] = useState<
    "announcement" | "work" | "good" | "useful"
  >("announcement");
  const [important, setImportant] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  async function publishPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (postTitle.trim().length < 3 || postBody.trim().length < 10) return;

    setPublishing(true);
    setPublishMessage("");
    try {
      const result = await createHousePost(
        house.id,
        postTitle.trim(),
        postBody.trim(),
        postType,
        important
      );
      setPostTitle("");
      setPostBody("");
      setPostType("announcement");
      setImportant(false);
      setComposerOpen(false);
      setPublishMessage(
        result.maxSent > 0
          ? `Пост опубликован · уведомлений в MAX: ${result.maxSent}`
          : result.maxFailed > 0
            ? "Пост опубликован, но MAX временно не принял уведомление"
          : "Пост опубликован · уведомление сохранено для MAX"
      );
    } catch (error) {
      setPublishMessage(
        error instanceof Error ? error.message : "Не удалось опубликовать пост"
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="houseNewsList">
      <div className="houseNewsHeading">
        <div>
          <h2>Все новости по дому</h2>
          <small>{house.address}</small>
        </div>
        <button
          className="createHousePostButton"
          onClick={() => {
            setComposerOpen((open) => !open);
            setPublishMessage("");
          }}
        >
          {composerOpen ? "Закрыть" : "＋ Написать пост"}
        </button>
      </div>

      {composerOpen && (
        <form className="housePostComposer" onSubmit={publishPost}>
          <div className="housePostComposerIntro">
            <span>УК</span>
            <div>
              <b>Публикация управляющей компании</b>
              <small>Прототип кабинета УК · жители получат уведомление в MAX</small>
            </div>
          </div>

          <label>
            Заголовок
            <input
              value={postTitle}
              onChange={(event) => setPostTitle(event.target.value)}
              placeholder="Например, проверка системы отопления"
              maxLength={120}
            />
          </label>

          <label>
            Текст поста
            <textarea
              value={postBody}
              onChange={(event) => setPostBody(event.target.value)}
              placeholder="Расскажите жителям, что произойдёт, когда и к кому обратиться с вопросом"
              maxLength={1000}
            />
          </label>

          <div className="housePostTypes" aria-label="Тип публикации">
            {(
              [
                ["announcement", "Объявление"],
                ["work", "Работы"],
                ["good", "Хорошая новость"],
                ["useful", "Полезное"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                className={postType === value ? "active" : ""}
                onClick={() => setPostType(value)}
                key={value}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="housePostImportant">
            <input
              type="checkbox"
              checked={important}
              onChange={(event) => setImportant(event.target.checked)}
            />
            <span>
              <b>Важное уведомление</b>
              <small>Пост попадёт в блок «Что сейчас важно»</small>
            </span>
          </label>

          <button
            className="publishHousePost"
            disabled={
              publishing ||
              postTitle.trim().length < 3 ||
              postBody.trim().length < 10
            }
          >
            {publishing ? "Публикуем…" : "Опубликовать и уведомить в MAX"}
          </button>
        </form>
      )}

      {publishMessage && (
        <div className="housePostResult" role="status">
          {publishMessage}
        </div>
      )}

      {house.events.length > 0 ? (
        house.events.map((event) => (
          <EventCard
            key={event.id}
            item={event}
            houseAddress={
              house.address
            }
            onClick={() =>
              selectEvent(event.id)
            }
          />
        ))
      ) : (
        <article className="houseWelcomeNews">
          <img
            src={house.image || "/assets/events/playground.jpg"}
            alt=""
          />
          <div>
            <span className="tag">Новости дома</span>
            <h3>Дом добавлен в ваш профиль</h3>
            <p>
              Здесь будут появляться объявления управляющей компании,
              плановые работы и важные новости для жильцов.
            </p>
          </div>
        </article>
      )}
    </div>
  );
}

function RequestsTab({
  house,
  createRequest,
  joinRequest,
  updateRequest,
}: {
  house: House;
  createRequest: () => void;
  joinRequest: (
    buildingId: number,
    requestId: number
  ) => Promise<void>;
  updateRequest: (
    buildingId: number,
    requestId: number,
    category: string,
    description: string
  ) => Promise<void>;
}) {
  const [
    scope,
    setScope,
  ] = useState<
    "mine" | "all"
  >("mine");

  const requests = sortRequestsByPriority(
    scope === "mine"
      ? house.requests.filter(
          (request) =>
            request.isMine !== false
        )
      : house.requests
  );

  return (
    <div>
      <div className="segmented">
        <button
          className={
            scope === "mine"
              ? "active"
              : ""
          }
          onClick={() =>
            setScope("mine")
          }
        >
          Мои заявки
        </button>

        <button
          className={
            scope === "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setScope("all")
          }
        >
          Все заявки дома
        </button>
      </div>

      {requests.length > 0 ? (
        requests.map((request) => (
          <RequestRow
            key={request.id}
            houseId={house.id}
            request={request}
            showJoin={scope === "all"}
            joinRequest={joinRequest}
            updateRequest={updateRequest}
          />
        ))
      ) : (
        <div className="empty">
          В этом разделе пока нет
          заявок.
        </div>
      )}

      <button
        className="primary stickyAction"
        onClick={
          createRequest
        }
      >
        ＋ Создать заявку
      </button>
    </div>
  );
}

function RequestRow({
  houseId,
  request,
  showJoin,
  joinRequest,
  updateRequest,
}: {
  houseId: number;
  request: RequestItem;
  showJoin: boolean;
  joinRequest: (buildingId: number, requestId: number) => Promise<void>;
  updateRequest: (
    buildingId: number,
    requestId: number,
    category: string,
    description: string
  ) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [category, setCategory] = useState(request.category);
  const [description, setDescription] = useState(request.description);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCategory(request.category);
    setDescription(request.description);
  }, [request.category, request.description]);

  const canEdit =
    request.canEdit !== false &&
    request.isMine !== false &&
    !["DONE", "CANCELLED"].includes(request.status);

  async function save() {
    if (!category.trim() || !description.trim()) return;
    setBusy(true);
    try {
      await updateRequest(
        houseId,
        request.id,
        category.trim(),
        description.trim()
      );
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`requestRow ${editing ? "isEditing" : ""}`}>
      <span>🔧</span>

      <div className="requestBody">
        <b>{request.description}</b>
        <small>#{request.id} · {request.category}</small>
        {request.collective && (
          <small className="collectiveMeta">
            👥 {request.residents || 1} жильцов поддерживают
          </small>
        )}
      </div>

      <em className={`requestStatus ${request.status}`}>
        {requestStatusText(request.status)}
      </em>

      {canEdit && !editing && (
        <button
          className="editRequestBtn"
          onClick={() => setEditing(true)}
        >
          Изменить
        </button>
      )}

      {showJoin && request.collective && !request.isMine && (
        <button
          className="joinRequestBtn"
          onClick={() => void joinRequest(houseId, request.id)}
        >
          Присоединиться
        </button>
      )}

      {editing && (
        <div className="requestEditor">
          <label>
            Категория
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </label>
          <label>
            Описание
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div>
            <button onClick={() => setEditing(false)}>Отмена</button>
            <button
              className="saveRequestBtn"
              onClick={() => void save()}
              disabled={busy}
            >
              {busy ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function MetersTab({
  house,
  submitMeter,
}: {
  house: House;
  submitMeter: (
    buildingId: number,
    meterId: number,
    value: string
  ) => Promise<void>;
}) {
  const [showFinance, setShowFinance] = useState(false);

  return (
    <div className="metersSection">
      <div className="metersHeader">
        <div>
          <h2>Приборы учёта</h2>
          <small>Показания и история потребления</small>
        </div>
        <button
          className="financeButton"
          onClick={() => setShowFinance((current) => !current)}
        >
          ₽ Финансы и квитанции
        </button>
      </div>

      {showFinance && (
        <section className="financePanel">
          <div className="financeBalance">
            <span>К оплате до 10 октября</span>
            <b>4 832,40 ₽</b>
          </div>
          <div className="receiptList">
            <button>
              <span>Сентябрь 2026</span>
              <b>4 832,40 ₽</b>
              <small>Ожидает оплаты</small>
            </button>
            <button>
              <span>Август 2026</span>
              <b>4 615,20 ₽</b>
              <small className="paidReceipt">Оплачено</small>
            </button>
            <button>
              <span>Июль 2026</span>
              <b>4 408,70 ₽</b>
              <small className="paidReceipt">Оплачено</small>
            </button>
          </div>
        </section>
      )}

      {house.meters.length >
      0 ? (
        house.meters.map(
          (meter) => (
            <MeterRow
              key={meter.id}
              houseId={house.id}
              meter={meter}
              submitMeter={
                submitMeter
              }
            />
          )
        )
      ) : (
        <div className="empty">
          Для этого дома приборы
          учёта пока не добавлены.
        </div>
      )}
    </div>
  );
}

function MeterRow({
  houseId,
  meter,
  submitMeter,
}: {
  houseId: number;
  meter: MeterItem;
  submitMeter: (
    buildingId: number,
    meterId: number,
    value: string
  ) => Promise<void>;
}) {
  const [value, setValue] =
    useState(
      meter.lastValue
    );

  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    setValue(
      meter.lastValue
    );
  }, [meter.lastValue]);

  async function submit() {
    if (!value.trim()) {
      return;
    }

    setBusy(true);

    try {
      await submitMeter(
        houseId,
        meter.id,
        value.trim()
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`meter meterInteractive ${
        meter.submissionRequired
          ? "meterNeedsAttention"
          : ""
      }`}
    >
      <span>
        {meter.kind.includes(
          "water"
        )
          ? "💧"
          : "⚡"}
      </span>

      <div>
        <b>{meter.name}</b>

        <div className="meterSubmitForm">
          <input
            value={value}
            onChange={(event) =>
              setValue(
                event.target.value
              )
            }
            inputMode="decimal"
          />

          <span>
            {meter.unit}
          </span>

          <button
            type="button"
            onClick={submit}
            disabled={busy}
          >
            {busy
              ? "..."
              : meter.submissionRequired
                ? "Передать"
                : "Обновить"}
          </button>
        </div>

        <HistoricalChart
          meter={meter}
          currentValue={value}
        />
      </div>
    </div>
  );
}

function HistoricalChart({
  meter,
  currentValue,
}: {
  meter: MeterItem;
  currentValue: string;
}) {
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const initialBase = useRef(
    Number(String(meter.lastValue).replace(",", ".")) || 100
  );
  const actualValue =
    Number(String(currentValue).replace(",", ".")) || initialBase.current;
  const months = ["Апр", "Май", "Июн", "Июл", "Авг", "Сен"];
  const factors = [0.76, 0.82, 0.79, 0.9, 0.94];
  const previousValues = factors.map((factor) =>
    meter.kind === "electricity"
      ? Math.round(initialBase.current * factor)
      : Number((initialBase.current * factor).toFixed(1))
  );
  const values = [...previousValues, actualValue];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const points = values.map((value, index) => ({
    x: 12 + index * 55,
    y: 76 - ((value - min) / spread) * 52,
    value,
    month: months[index],
  }));

  return (
    <div className="meterHistory" onMouseLeave={() => setActivePoint(null)}>
      <div className="meterHistoryTitle">
        <span>История за 6 месяцев</span>
        <small>
          Сейчас: <b>{actualValue} {meter.unit}</b>
        </small>
      </div>
      <div className="chartCanvas">
        <svg viewBox="0 0 300 102" role="img" aria-label={`История показаний: ${meter.name}`}>
          <defs>
            <linearGradient id={`chart-fill-${meter.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f80ed" stopOpacity="0.24" />
              <stop offset="1" stopColor="#2f80ed" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[24, 50, 76].map((y) => (
            <line key={y} x1="8" x2="292" y1={y} y2={y} className="chartGrid" />
          ))}
          <path
            className="chartArea"
            fill={`url(#chart-fill-${meter.id})`}
            d={`M ${points[0].x} 86 L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points[points.length - 1].x} 86 Z`}
          />
          <polyline
            className="chartLine"
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          />
          {points.map((point, index) => (
            <g key={point.month}>
              <circle
                className={`chartPoint ${activePoint === index ? "active" : ""}`}
                cx={point.x}
                cy={point.y}
                r="5"
                tabIndex={0}
                onMouseEnter={() => setActivePoint(index)}
                onFocus={() => setActivePoint(index)}
                onBlur={() => setActivePoint(null)}
                onClick={() => setActivePoint(index)}
              >
                <title>{point.month}: {point.value} {meter.unit}</title>
              </circle>
              <text x={point.x} y="99" textAnchor="middle" className="chartLabel">
                {point.month}
              </text>
            </g>
          ))}
        </svg>

        {activePoint !== null && (
          <div
            className="chartTooltip"
            style={{
              left: `${(points[activePoint].x / 300) * 100}%`,
              top: `${Math.max(6, (points[activePoint].y / 102) * 100)}%`,
            }}
          >
            <b>{points[activePoint].value} {meter.unit}</b>
            <small>{points[activePoint].month} 2026</small>
          </div>
        )}
      </div>
    </div>
  );
}

function RenovationTab({
  house,
}: {
  house: House;
}) {
  return (
    <div>
      <div className="renoHero">
        🏢

        <div>
          <b>
            Работы и капитальный
            ремонт
          </b>

          <p>Плановые и выполненные работы</p>
        </div>
      </div>

      <h3>
        План работ
      </h3>

      {house.repairs.length >
      0 ? (
        <div className="timeline">
          {house.repairs.map(
            (repair) => (
              <p
                key={repair.id}
              >
                <b>
                  {repair.year}{" "}
                  {repair.status ===
                  "DONE"
                    ? "✓"
                    : repair.status ===
                        "IN_PROGRESS"
                      ? "●"
                      : "○"}
                </b>{" "}
                {repair.title}

                <small>
                  {repair.status ===
                  "DONE"
                    ? "Завершено"
                    : repair.status ===
                        "IN_PROGRESS"
                      ? "Выполняется"
                      : "Запланировано"}
                </small>
              </p>
            )
          )}
        </div>
      ) : (
        <div className="empty">
          План работ пока не
          опубликован.
        </div>
      )}
    </div>
  );
}

function AboutTab({
  house,
}: {
  house: House;
}) {
  return (
    <div>
      <h3>
        Основная информация
      </h3>

      <div className="details">
        <p>
          Год постройки{" "}
          <b>{house.year}</b>
        </p>

        <p>
          Тип дома{" "}
          <b>{house.type}</b>
        </p>

        <p>
          Этажей{" "}
          <b>{house.floors}</b>
        </p>

        <p>
          Подъездов{" "}
          <b>
            {house.entrances}
          </b>
        </p>

        <p>
          Квартир{" "}
          <b>
            {house.apartments}
          </b>
        </p>

        <p>
          Площадь дома{" "}
          <b>{house.area}</b>
        </p>
      </div>

      <h3>
        Управляющая организация
      </h3>

      <div className="company">
        🏢

        <div>
          <b>
            {house.company}
          </b>
          <small>
            Диспетчерская и общие вопросы
          </small>
        </div>

        <a href="tel:+74951234567">Позвонить</a>
      </div>

      <h3>
        Аварийная служба
      </h3>

      <div className="company">
        🚨

        <div>
          <b>
            {house.emergencyPhone ||
              "+7 (495) 123-45-67"}
          </b>
          <small>
            Круглосуточно
          </small>
        </div>

        <a href="tel:+74951234567">Позвонить</a>
      </div>

      <h3>Контакты служб</h3>

      <div className="contactList">
        <a href="tel:+74957843109" className="company">
          <span>🔧</span>
          <div>
            <b>Сантехническая служба</b>
            <small>+7 (495) 784-31-09 · ежедневно 08:00–22:00</small>
          </div>
          <strong>›</strong>
        </a>

        <a href="tel:+74953261844" className="company">
          <span>⚡</span>
          <div>
            <b>Дежурный электрик</b>
            <small>+7 (495) 326-18-44 · круглосуточно</small>
          </div>
          <strong>›</strong>
        </a>

        <a href="mailto:help@uyut-dom.example" className="company">
          <span>✉️</span>
          <div>
            <b>Написать в УК</b>
            <small>help@uyut-dom.example · ответ в течение дня</small>
          </div>
          <strong>›</strong>
        </a>

        <a href="tel:+74956422017" className="company">
          <span>🛗</span>
          <div>
            <b>Лифтовая служба</b>
            <small>+7 (495) 642-20-17 · круглосуточно</small>
          </div>
          <strong>›</strong>
        </a>
      </div>
    </div>
  );
}
