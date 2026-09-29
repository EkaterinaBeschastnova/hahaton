import { useState } from "react";

import {
  BackHeader,
} from "../components/UI";
import {
  useHouseStore,
} from "../state/HouseStore";
import { getEventImage } from "../data/eventVisuals";
import type {
  HouseTab,
} from "../types";

export function NotificationsPage({
  back,
}: {
  back: () => void;
}) {
  const { myHouses } = useHouseStore();
  const firstHouse = myHouses[0];
  const secondHouse = myHouses[1] || firstHouse;
  const activeRequest = myHouses
    .flatMap((house) => house.requests)
    .find((request) => request.status !== "DONE" && request.status !== "CANCELLED");

  const notifications = [
    {
      title: firstHouse?.address || "ул. Пушкина, 7",
      detail: firstHouse?.company || "УК «Мой дом»",
      status: "Отключение горячей воды",
      tone: "critical",
    },
    {
      title: secondHouse?.address || "проспект Мира, 24",
      detail: secondHouse?.company || "ТСЖ «Прогресс»",
      status: "Плановые работы завершены",
      tone: "success",
    },
    {
      title: `Заявка #${activeRequest?.id || 1042}`,
      detail: activeRequest?.description || "Ремонт освещения на 3 этаже",
      status: "В работе у мастера",
      tone: "progress",
    },
  ];

  return (
    <>
      <BackHeader
        title="Уведомления"
        onBack={back}
      />

      <p className="notificationsIntro">
        Важное по вашим домам и заявкам — в порядке срочности.
      </p>

      <section className="houseNotifications" aria-label="Последние уведомления">
        {notifications.map((notification) => (
          <article className="houseNotificationRow" key={notification.title}>
            <div>
              <b>{notification.title}</b>
              <small>{notification.detail}</small>
            </div>
            <span className={`notificationStatus ${notification.tone}`}>
              {notification.status}
            </span>
          </article>
        ))}
      </section>

      <section className="notificationPrinciples" aria-label="Как работают уведомления">
        <article className="notificationPrinciple priority">
          <b>Приоритет срочности</b>
          <p>
            События ранжируются по критичности для жителя, а не по времени
            загрузки.
          </p>
        </article>
        <article className="notificationPrinciple">
          <b>Честный статус</b>
          <p>
            При недоступности внешнего источника указывается время последнего
            обновления.
          </p>
        </article>
      </section>

      <details className="notificationSettings">
        <summary>Какие уведомления получать</summary>
        <div className="notificationToggleList">
          <label><span>Аварии и отключения</span><input type="checkbox" defaultChecked /></label>
          <label><span>Работы по дому</span><input type="checkbox" defaultChecked /></label>
          <label><span>Новости и объявления</span><input type="checkbox" defaultChecked /></label>
          <label><span>Статусы заявок</span><input type="checkbox" defaultChecked /></label>
        </div>
      </details>

      <p className="notificationsDelivery">
        Уведомления также приходят в бот MAX, даже когда Mini App закрыт.
      </p>
    </>
  );
}

export function SettingsPage({
  back,
}: {
  back: () => void;
}) {
  return (
    <>
      <BackHeader
        title="Настройки"
        onBack={back}
      />

      <div className="menuList">
        <div className="settingsStaticRow">
          🌐
          <span>
            <b>Язык</b>
            <small>
              Русский
            </small>
          </span>
        </div>

        <div className="settingsStaticRow">
          ☀️
          <span>
            <b>Тема</b>
            <small>
              Системная
            </small>
          </span>
        </div>

        <div className="settingsStaticRow">
          📏
          <span>
            <b>
              Единицы измерения
            </b>
            <small>
              м³, кВт⋅ч
            </small>
          </span>
        </div>
      </div>
    </>
  );
}

export function SecurityPage({
  back,
}: {
  back: () => void;
}) {
  const [analytics, setAnalytics] = useState(false);
  const [meterAccess, setMeterAccess] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <>
      <BackHeader title="Безопасность и приватность" onBack={back} />

      <section className="securityHero">
        <span>🛡️</span>
        <div>
          <b>Аккаунт защищён</b>
          <p>Вход выполнен на этом устройстве. Подозрительной активности нет.</p>
        </div>
      </section>

      <h2 className="settingsSectionTitle">Приватность</h2>
      <div className="menuList securityList">
        <label className="toggleRow">
          <span>
            📊
            <span>
              <b>Анонимная аналитика</b>
              <small>Помогает улучшать приложение без передачи личных данных</small>
            </span>
          </span>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(event) => setAnalytics(event.target.checked)}
          />
        </label>

        <label className="toggleRow">
          <span>
            💧
            <span>
              <b>Доступ к показаниям</b>
              <small>Разрешить УК получать отправленные показания счётчиков</small>
            </span>
          </span>
          <input
            type="checkbox"
            checked={meterAccess}
            onChange={(event) => setMeterAccess(event.target.checked)}
          />
        </label>

        <label className="toggleRow">
          <span>
            🔔
            <span>
              <b>Уведомления о входе</b>
              <small>Сообщать о входе в аккаунт с нового устройства</small>
            </span>
          </span>
          <input
            type="checkbox"
            checked={loginAlerts}
            onChange={(event) => setLoginAlerts(event.target.checked)}
          />
        </label>
      </div>

      <h2 className="settingsSectionTitle">Ваши данные</h2>
      <div className="privacyDetails">
        <div>
          <span>📱</span>
          <p><b>Текущее устройство</b><small>Windows · активная сессия сейчас</small></p>
          <em>Активно</em>
        </div>
        <div>
          <span>🗂️</span>
          <p><b>Хранение данных</b><small>Профиль сохранён только для работы приложения</small></p>
        </div>
        <div>
          <span>📄</span>
          <p><b>Согласия и документы</b><small>Правила сервиса и политика обработки данных</small></p>
          <strong>›</strong>
        </div>
      </div>

      <div className="privacyNotice">
        Мы не запрашиваем паспортные данные и не передаём контакты третьим
        лицам. Настройки приватности можно изменить в любое время.
      </div>
    </>
  );
}

export function EventDetail({
  id,
  back,
  selectHouse,
}: {
  id: number | null;
  back: () => void;
  selectHouse: (
    id: number,
    tab?: HouseTab
  ) => void;
}) {
  const { findEvent } =
    useHouseStore();

  const result =
    id === null
      ? undefined
      : findEvent(id);

  if (!result) {
    return (
      <>
        <BackHeader
          title="Событие"
          onBack={back}
        />

        <div className="empty">
          <b>
            Событие не найдено
          </b>
          <p>
            Оно не относится ни к
            одному из ваших домов или
            было удалено.
          </p>
        </div>
      </>
    );
  }

  const { house, event } =
    result;

  return (
    <>
      <BackHeader
        title="Событие"
        onBack={back}
      />

      <div
        className={`detailHero ${event.type}`}
      >
        <img src={getEventImage(event)} alt="" />
      </div>

      <article className="article">
        <span className="tag">
          {house.address} ·{" "}
          {event.date}
        </span>

        <h1>{event.title}</h1>

        <p>{event.body}</p>

        <button
          className="soft eventHouseLink"
          onClick={() =>
            selectHouse(
              house.id,
              "События"
            )
          }
        >
          🏢 Открыть{" "}
          {house.address}
        </button>

        <p>
          Это событие хранится внутри
          записи дома #{house.id} и не
          может открыться у другого
          адреса.
        </p>
      </article>
    </>
  );
}
