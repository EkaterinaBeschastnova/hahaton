import {
  useMemo,
  useState,
} from "react";

import {
  BackHeader,
} from "../components/UI";
import {
  useHouseStore,
} from "../state/HouseStore";

export default function AddHousePage({
  back,
  done,
}: {
  back: () => void;
  done: (
    houseId: number,
    relation: string,
    apartment: string
  ) => Promise<void>;
}) {
  const {
    catalog,
    myHouses,
  } = useHouseStore();

  const [step, setStep] =
    useState(1);

  const [search, setSearch] =
    useState("");

  const [
    selectedHouseId,
    setSelectedHouseId,
  ] = useState<number | null>(
    null
  );

  const [relation, setRelation] =
    useState("");

  const [
    apartment,
    setApartment,
  ] = useState("");

  const [
    duplicateMessage,
    setDuplicateMessage,
  ] = useState("");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedHouse =
    selectedHouseId === null
      ? undefined
      : catalog.find(
          (house) =>
            house.id ===
            selectedHouseId
        );

  const connectedIds = useMemo(
    () =>
      new Set(
        myHouses.map(
          (house) => house.id
        )
      ),
    [myHouses]
  );

  const normalizedSearch =
    search
      .trim()
      .toLowerCase()
      .replace(/[.,]/g, " ")
      .replace(/\s+/g, " ");

  const filteredHouses =
    normalizedSearch.length === 0
      ? []
      : catalog
          .filter((house) => {
            const source =
              `${house.street} ${house.houseNumber} ${house.address} ${house.city}`
                .toLowerCase()
                .replace(
                  /[.,]/g,
                  " "
                )
                .replace(
                  /\s+/g,
                  " "
                );

            return normalizedSearch
              .split(" ")
              .filter(Boolean)
              .every((word) =>
                source.includes(word)
              );
          })
          .slice(0, 8);

  function chooseHouse(
    houseId: number
  ) {
    const house =
      catalog.find(
        (item) =>
          item.id === houseId
      );

    if (!house) {
      return;
    }

    if (
      connectedIds.has(house.id)
    ) {
      setDuplicateMessage(
        `${house.address} уже добавлен в раздел «Мой дом»`
      );
      return;
    }

    setDuplicateMessage("");
    setSelectedHouseId(
      house.id
    );
    setSearch(house.address);
    setStep(3);
  }

  async function finish() {
    if (
      !selectedHouse ||
      !relation
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await done(
        selectedHouse.id,
        relation,
        apartment.trim()
      );
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : "Не удалось добавить дом"
      );
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    if (step === 1) {
      back();
      return;
    }

    setError("");
    setDuplicateMessage("");
    setStep((current) =>
      Math.max(
        1,
        current - 1
      )
    );
  }

  return (
    <>
      <BackHeader
        title="Добавить дом"
        onBack={goBack}
      />

      <div className="progress">
        <i
          style={{
            width: `${step * 25}%`,
          }}
        />
      </div>

      <small className="step">
        Шаг {step} из 4
      </small>

      {step === 1 && (
        <div className="wizard">
          <h1>Добавить дом</h1>

          <p>
            Найдите дом в едином
            каталоге. После добавления
            все события, заявки,
            счётчики и ремонты будут
            привязаны к его ID.
          </p>

          <div className="wizardArt">
            🏢📍🌳
          </div>

          <div className="benefits">
            <p>
              🔔 События только вашего
              дома
            </p>
            <p>
              🔧 Заявки привязаны к
              конкретному дому
            </p>
            <p>
              💧 Показания и ремонты не
              смешиваются между адресами
            </p>
          </div>

          <button
            className="primary"
            onClick={() =>
              setStep(2)
            }
          >
            Найти дом
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="wizard">
          <h1>Введите адрес</h1>

          <p>
            Начните вводить улицу,
            номер дома или город.
          </p>

          <div className="addressSearch">
            <span className="addressSearchIcon">
              ⌕
            </span>

            <input
              autoFocus
              type="text"
              value={search}
              placeholder="Например: Пушкина 12"
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setDuplicateMessage(
                  ""
                );
              }}
            />

            {search && (
              <button
                type="button"
                className="clearSearch"
                onClick={() => {
                  setSearch("");
                  setDuplicateMessage(
                    ""
                  );
                }}
              >
                ×
              </button>
            )}
          </div>

          {duplicateMessage && (
            <div className="infoBox">
              🏠 {duplicateMessage}
            </div>
          )}

          {search.trim() !== "" && (
            <div className="suggestions">
              {filteredHouses.length >
              0 ? (
                filteredHouses.map(
                  (house) => {
                    const added =
                      connectedIds.has(
                        house.id
                      );

                    return (
                      <button
                        type="button"
                        key={house.id}
                        onClick={() =>
                          chooseHouse(
                            house.id
                          )
                        }
                        className={
                          added
                            ? "alreadyAdded"
                            : ""
                        }
                      >
                        <span>
                          ⌖
                        </span>

                        <span>
                          <b>
                            {
                              house.address
                            }
                          </b>
                          <small>
                            г.{" "}
                            {
                              house.city
                            }{" "}
                            ·{" "}
                            {
                              house.district
                            }
                            {added
                              ? " · Уже добавлен"
                              : ""}
                          </small>
                        </span>

                        <strong>
                          {added
                            ? "✓"
                            : "›"}
                        </strong>
                      </button>
                    );
                  }
                )
              ) : (
                <div className="noAddress">
                  <span>⌕</span>
                  <b>
                    Дом не найден
                  </b>
                  <small>
                    Попробуйте изменить
                    запрос
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 3 &&
        selectedHouse && (
          <div className="wizard">
            <h1>
              Проверьте информацию
            </h1>

            <p>
              Это запись дома из
              единого каталога.
            </p>

            <div className="previewHouse">
              🏢
            </div>

            <h2>
              {selectedHouse.address}
            </h2>

            <p>
              г. {selectedHouse.city},{" "}
              {
                selectedHouse.district
              }
            </p>

            <div className="details">
              <p>
                Год постройки{" "}
                <b>
                  {
                    selectedHouse.year
                  }
                </b>
              </p>

              <p>
                Тип дома{" "}
                <b>
                  {
                    selectedHouse.type
                  }
                </b>
              </p>

              <p>
                Этажность{" "}
                <b>
                  {
                    selectedHouse.floors
                  }
                </b>
              </p>

              <p>
                Квартир{" "}
                <b>
                  {
                    selectedHouse.apartments
                  }
                </b>
              </p>
            </div>

            <button
              className="primary"
              onClick={() =>
                setStep(4)
              }
            >
              Добавить дом
            </button>

            <button
              className="linkBtn"
              onClick={() => {
                setSelectedHouseId(
                  null
                );
                setSearch("");
                setStep(2);
              }}
            >
              Это не мой дом
            </button>
          </div>
        )}

      {step === 4 &&
        selectedHouse && (
          <div className="wizard">
            <h1>
              Как вы связаны с этим
              домом?
            </h1>

            <p>
              Связь хранится отдельно
              от данных самого дома.
            </p>

            <div className="residentRoles">
              {[
                [
                  "owner",
                  "🏠",
                  "Собственник",
                  "Владею квартирой или помещением",
                ],
                [
                  "tenant",
                  "🔑",
                  "Арендатор",
                  "Снимаю квартиру или помещение",
                ],
                [
                  "commercial",
                  "🏢",
                  "Нежилое помещение",
                  "Офис, магазин или другое помещение",
                ],
                [
                  "other",
                  "👤",
                  "Другое",
                  "Проживаю здесь или представляю собственника",
                ],
              ].map(
                ([
                  value,
                  icon,
                  title,
                  description,
                ]) => (
                  <button
                    type="button"
                    key={value}
                    className={`residentRole ${
                      relation ===
                      value
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setRelation(
                        value
                      )
                    }
                  >
                    <span className="residentRoleIcon">
                      {icon}
                    </span>

                    <span>
                      <b>
                        {title}
                      </b>
                      <small>
                        {
                          description
                        }
                      </small>
                    </span>
                  </button>
                )
              )}
            </div>

            <label className="wizardLabel">
              Номер квартиры или
              помещения
            </label>

            <input
              className="wizardInput"
              value={apartment}
              onChange={(event) =>
                setApartment(
                  event.target.value
                )
              }
              placeholder="Например, 45"
            />

            {error && (
              <div className="infoBox">
                ⚠️ {error}
              </div>
            )}

            <button
              className="primary"
              disabled={
                !relation || busy
              }
              onClick={finish}
            >
              {busy
                ? "Добавляем..."
                : "Готово"}
            </button>
          </div>
        )}
    </>
  );
}
