import type { EventItem } from "../types";

const ASSET_ROOT = "/assets/events";

export function getEventImage(event: EventItem) {
  const title = event.title.toLocaleLowerCase("ru-RU");

  if (title.includes("площадк")) return `${ASSET_ROOT}/playground.jpg`;
  if (title.includes("уборк")) return `${ASSET_ROOT}/autumn-cleanup.jpg`;
  if (title.includes("лифт")) return `${ASSET_ROOT}/elevator-maintenance.jpg`;
  if (title.includes("электр") || event.icon === "⚡") return `${ASSET_ROOT}/electricity-work.jpg`;
  if (title.includes("вод") || event.icon === "💧") return `${ASSET_ROOT}/utility-tips.jpg`;
  if (event.type === "good") return `${ASSET_ROOT}/cat-help.jpg`;
  if (event.type === "work") return `${ASSET_ROOT}/autumn-cleanup.jpg`;

  return `${ASSET_ROOT}/playground.jpg`;
}
