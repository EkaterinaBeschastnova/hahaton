import React from "react";
import type {
  HouseStateLevel,
  Screen,
} from "../types";

export const Icon = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <span className="iconBubble">
    {children}
  </span>
);

export function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

export function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
    </svg>
  );
}

export function HouseStateBadge({
  level,
  text,
}: {
  level: HouseStateLevel;
  text: string;
}) {
  return (
    <span
      className={`badge ${level}`}
    >
      {text}
    </span>
  );
}

export function BackHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="topbar">
      <button
        className="iconBtn"
        onClick={onBack}
        aria-label="Назад"
      >
        ‹
      </button>

      <b>{title}</b>

      <div>
        {action || <span />}
      </div>
    </div>
  );
}

export function BottomNav({
  screen,
  go,
}: {
  screen: Screen;
  go: (screen: Screen) => void;
}) {
  return (
    <nav className="bottomNav">
      <button
        className={
          screen === "home"
            ? "active"
            : ""
        }
        onClick={() => go("home")}
      >
        <span>⌂</span>
        Главная
      </button>

      <button
        className={
          screen === "feed"
            ? "active"
            : ""
        }
        onClick={() => go("feed")}
      >
        <span>▤</span>
        События
      </button>

      <button
        className={
          screen === "profile"
            ? "active"
            : ""
        }
        onClick={() => go("profile")}
      >
        <span>♙</span>
        Профиль
      </button>
    </nav>
  );
}

export function Toast({
  text,
}: {
  text: string;
}) {
  return text ? (
    <div className="toast">
      ✓ {text}
    </div>
  ) : null;
}
