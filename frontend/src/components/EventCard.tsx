import type {
  EventItem,
} from "../types";
import { getEventImage } from "../data/eventVisuals";

const labels = {
  important: "Срочно",
  work: "Работы",
  announcement: "Объявление",
  useful: "Полезное",
  good: "Добрые новости",
};

export default function EventCard({
  item,
  houseAddress,
  onClick,
  layout = "compact",
}: {
  item: EventItem;
  houseAddress: string;
  onClick: () => void;
  layout?: "featured" | "compact";
}) {
  const image = getEventImage(item);

  return (
    <button
      className={`eventCard eventCard-${layout} ${item.type}`}
      onClick={onClick}
    >
      <div className="eventVisual">
        <img src={image} alt="" />

        {layout === "featured" && (
          <div className="eventImageMeta">
            <span className="tag">{labels[item.type]}</span>
            <small>{houseAddress} · {item.date}</small>
          </div>
        )}
      </div>

      <div className="eventBody">
        {layout === "compact" && (
          <div className="eventMeta">
            <span className="tag">{labels[item.type]}</span>
            <span>{houseAddress} · {item.date}</span>
          </div>
        )}

        <b>{item.title}</b>
        <p>{item.body}</p>
      </div>

      <span className="chev">
        ›
      </span>
    </button>
  );
}
