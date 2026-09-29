import {
  deriveHouseState,
} from "../domain/houseState";
import {
  useHouseStore,
} from "../state/HouseStore";
import { IconSettings } from "../components/UI";
import type {
  HouseTab,
  Screen,
  User,
} from "../types";

export default function ProfilePage({
  go,
  selectHouse,
  user,
}: {
  go: (screen: Screen) => void;
  selectHouse: (
    id: number,
    tab?: HouseTab
  ) => void;
  user: User | null;
}) {
  const { myHouses } =
    useHouseStore();

  return (
    <>
      <header className="pageHeader">
        <h1>Профиль</h1>

        <button
          className="iconBtn"
          onClick={() =>
            go("settings")
          }
        >
          <IconSettings />
        </button>
      </header>

      <button className="profileCard">
        <div className="profilePhoto">
          👩🏻
        </div>

        <div>
          <b>
            {user?.first_name || "Анна"} {user?.last_name || "Иванова"}
          </b>
          <p>
            {user?.phone || "+7 900 123-45-67"}
          </p>
          <small>
            {user?.authProvider === "gosuslugi"
              ? "Подтверждено через Госуслуги"
              : "Профиль жителя"}
          </small>
        </div>

        <span>›</span>
      </button>

      <button
        className="settingsHero"
        onClick={() =>
          go("notifications")
        }
      >
        <span>🔔</span>

        <div>
          <b>Уведомления</b>
          <p>
            Выберите, о чём получать
            уведомления в боте MAX
          </p>
        </div>

        <b>›</b>
      </button>

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

      <div className="profileHouses">
        {myHouses.map(
          (house) => {
            const state =
              deriveHouseState(
                house
              );

            const reason =
              state.reasons[0];

            return (
              <button
                key={house.id}
                onClick={() =>
                  selectHouse(
                    house.id
                  )
                }
              >
                <span>🏢</span>

                <div>
                  <b>
                    {
                      house.address
                    }
                  </b>

                  <small>
                    {house.apartment
                      ? `Квартира ${house.apartment}`
                      : "Дом добавлен"}
                  </small>

                  {state.level &&
                    reason && (
                      <small
                        className={`profileHouseState profileHouseState-${state.level}`}
                      >
                        {
                          reason.label
                        }
                      </small>
                    )}
                </div>

                <strong>›</strong>
              </button>
            );
          }
        )}
      </div>

      <button className="settingsHero blue">
        <span>🔗</span>

        <div>
          <b>
            Подключённые сервисы
          </b>

          <p>
            Госуслуги Дом, ГИС ЖКХ и
            другие
          </p>
        </div>

        <b>›</b>
      </button>

      <h2>
        Настройки приложения
      </h2>

      <div className="menuList">
        <button
          onClick={() =>
            go("settings")
          }
        >
          ⚙️
          <span>
            <b>
              Общие настройки
            </b>
            <small>
              Язык, тема, единицы
              измерения
            </small>
          </span>
          ›
        </button>

        <button onClick={() => go("security")}>
          🛡️
          <span>
            <b>
              Безопасность и
              приватность
            </b>
            <small>
              Управление данными
            </small>
          </span>
          ›
        </button>

        <button>
          ❔
          <span>
            <b>
              Помощь и поддержка
            </b>
            <small>
              Ответы на вопросы,
              связь с командой
            </small>
          </span>
          ›
        </button>
      </div>
    </>
  );
}
