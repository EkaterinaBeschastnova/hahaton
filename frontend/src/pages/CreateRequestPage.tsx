import {
  useState,
} from "react";

import {
  BackHeader,
} from "../components/UI";
import {
  useHouseStore,
} from "../state/HouseStore";

export default function CreateRequestPage({
  back,
  buildingId,
  onSubmit,
}: {
  back: () => void;
  buildingId: number;
  onSubmit: (
    category: string,
    description: string
  ) => Promise<void>;
}) {
  const { getHouseById } =
    useHouseStore();

  const house =
    getHouseById(buildingId);

  const [
    category,
    setCategory,
  ] = useState("Водоснабжение");

  const [
    description,
    setDescription,
  ] = useState("");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const categories = [
    "Водоснабжение",
    "Отопление",
    "Электричество",
    "Лифт",
    "Уборка",
    "Мусор",
    "Двор",
    "Домофон",
    "Ремонт",
    "Другое",
  ];

  async function submit() {
    if (!description.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await onSubmit(
        category,
        description.trim()
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось создать заявку"
      );
    } finally {
      setBusy(false);
    }
  }

  if (!house) {
    return (
      <>
        <BackHeader
          title="Новая заявка"
          onBack={back}
        />
        <div className="empty">
          Дом не найден. Вернитесь к
          списку домов и выберите его
          заново.
        </div>
      </>
    );
  }

  return (
    <>
      <BackHeader
        title="Новая заявка"
        onBack={back}
      />

      <div className="formPage">
        <h1>Что случилось?</h1>

        <p>
          Заявка будет создана для{" "}
          <b>{house.address}</b>. Она
          не попадёт в другой дом.
        </p>

        <label>Категория</label>

        <div className="categoryGrid">
          {categories.map(
            (item) => (
              <button
                type="button"
                className={
                  category === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory(item)
                }
                key={item}
              >
                {item}
              </button>
            )
          )}
        </div>

        <label>Описание</label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="Например: в подъезде течёт труба..."
        />

        <button
          className="photoBtn"
          type="button"
        >
          📷 Добавить фото
        </button>

        {error && (
          <div className="infoBox">
            ⚠️ {error}
          </div>
        )}

        <button
          className="primary"
          disabled={
            !description.trim() ||
            busy
          }
          onClick={submit}
        >
          {busy
            ? "Отправляем..."
            : "Отправить заявку"}
        </button>
      </div>
    </>
  );
}
