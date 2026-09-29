import { useMemo, useState } from "react";

import { getEventImage } from "../data/eventVisuals";
import { useHouseStore } from "../state/HouseStore";
import type { EventType } from "../types";

type FeedFilter =
  | "Все"
  | "Мой дом"
  | "Работы"
  | "Объявления"
  | "Добрые новости";

const labels: Record<EventType, string> = {
  important: "Срочно",
  work: "Работы",
  announcement: "Объявление",
  useful: "Полезное",
  good: "Добрые новости",
};

const stories = [
  {
    title: "С первым днём осени!",
    meta: "Все дома",
    image: "/assets/events/autumn-cleanup.jpg",
    body: "Осень — время уютных дворов и добрых соседских встреч. Собрали главное о сезонных работах и подготовке домов к холодам.",
  },
  {
    title: "Обновили площадку",
    meta: "Благоустройство",
    image: "/assets/events/playground.jpg",
    body: "Установили новые игровые элементы, мягкое покрытие, освещение и удобные лавочки для родителей.",
  },
  {
    title: "Поможем соседскому коту",
    meta: "Добрые новости",
    image: "/assets/events/cat-help.jpg",
    body: "Жильцы организовали сбор корма и поиск дома для дружелюбного кота из нашего двора. Присоединиться может каждый.",
  },
  {
    title: "Как экономить на ЖКУ",
    meta: "Полезное",
    image: "/assets/events/utility-tips.jpg",
    body: "Пять простых привычек помогут снизить расход воды и электричества без потери комфорта.",
  },
];

export default function FeedPage() {
  const { myHouses } = useHouseStore();
  const [filter, setFilter] = useState<FeedFilter>("Все");
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [storyExpanded, setStoryExpanded] = useState(false);

  const items = useMemo(
    () =>
      myHouses.flatMap((house) =>
        house.events.map((event) => ({ house, event }))
      ),
    [myHouses]
  );

  const filtered = items.filter(({ event }) => {
    if (filter === "Все" || filter === "Мой дом") return true;
    if (filter === "Работы") return event.type === "work";
    if (filter === "Объявления") return event.type === "announcement";
    return event.type === "good";
  });

  const filters: FeedFilter[] = [
    "Все",
    "Мой дом",
    "Работы",
    "Объявления",
    "Добрые новости",
  ];

  function showStory(index: number) {
    setStoryIndex(index);
    setStoryExpanded(false);
  }

  function moveStory(direction: number) {
    if (storyIndex === null) return;
    const next = (storyIndex + direction + stories.length) % stories.length;
    showStory(next);
  }

  const activeStory = storyIndex === null ? null : stories[storyIndex];

  return (
    <>
      <header className="pageHeader feedHeader">
        <div>
          <h1>Лента</h1>
          <p>
            Новости, события и объявления<br />
            по вашему дому
          </p>
        </div>

        <button className="feedSearch" aria-label="Поиск">⌕</button>
      </header>

      <div className="chips">
        {filters.map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="feedStories" aria-label="Истории дома">
        {stories.map((story, index) => (
          <button
            className="feedStory"
            key={story.title}
            onClick={() => showStory(index)}
          >
            <img src={story.image} alt="" />
            <div>
              <b>{story.title}</b>
              <small>{story.meta}</small>
            </div>
          </button>
        ))}
      </div>

      <section className="feedPosts" aria-label="Лента публикаций">
        {filtered.length > 0 ? (
          filtered.map(({ house, event }) => (
            <article className="feedPost" key={`${house.id}-${event.id}`}>
              <img src={getEventImage(event)} alt="" />
              <div className="feedPostContent">
                <div className="feedPostMeta">
                  <span className="tag">{labels[event.type]}</span>
                  <small>{house.address} · {event.date}</small>
                </div>
                <h2>{event.title}</h2>
                <p>{event.body}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">В этой категории пока нет публикаций.</div>
        )}
      </section>

      {activeStory && storyIndex !== null && (
        <div className="storyViewer" role="dialog" aria-modal="true">
          <img src={activeStory.image} alt="" />
          <div className="storyShade" />

          <div className="storyProgress">
            {stories.map((story, index) => (
              <i className={index === storyIndex ? "active" : ""} key={story.title} />
            ))}
          </div>

          <button
            className="storyClose"
            aria-label="Закрыть историю"
            onClick={() => setStoryIndex(null)}
          >
            ×
          </button>
          <button
            className="storyPrevious"
            aria-label="Предыдущая история"
            onClick={() => moveStory(-1)}
          />
          <button
            className="storyNext"
            aria-label="Следующая история"
            onClick={() => moveStory(1)}
          />

          <div className={`storyCaption ${storyExpanded ? "expanded" : ""}`}>
            <small>{activeStory.meta}</small>
            <h2>{activeStory.title}</h2>
            <p>{activeStory.body}</p>
            <button onClick={() => setStoryExpanded((value) => !value)}>
              {storyExpanded ? "Свернуть" : "Ещё"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
