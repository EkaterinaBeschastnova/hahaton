import React, {
  useEffect,
  useState,
} from "react";

import AddHousePage from "../pages/AddHousePage";
import AuthPage from "../pages/AuthPage";
import CreateRequestPage from "../pages/CreateRequestPage";
import FeedPage from "../pages/FeedPage";
import HomePage from "../pages/HomePage";
import HousePage from "../pages/HousePage";
import ProfilePage from "../pages/ProfilePage";
import {
  EventDetail,
  NotificationsPage,
  SecurityPage,
  SettingsPage,
} from "../pages/UtilityPages";

import {
  BottomNav,
  Toast,
} from "../components/UI";
import {
  HouseProvider,
  useHouseStore,
} from "../state/HouseStore";
import { api } from "../services/api";
import type {
  HouseTab,
  Screen,
  User,
} from "../types";

const SAVED_ACCOUNT_KEY = "myDomAccountV1";

declare global {
  interface Window {
    WebApp?: {
      initData?: string;
    };
  }
}

const MAX_INIT_DATA = window.WebApp?.initData || "";

function loadSavedAccount(): User | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_ACCOUNT_KEY) || "null");
    return saved?.first_name && saved?.last_name ? saved : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [savedAccount, setSavedAccount] = useState<User | null>(() =>
    MAX_INIT_DATA ? null : loadSavedAccount()
  );

  const [token, setToken] = useState(
    MAX_INIT_DATA ? "" : localStorage.getItem("token") || ""
  );

  const [user, setUser] = useState<User | null>(() =>
    MAX_INIT_DATA ? null : loadSavedAccount()
  );
  const [maxRegistrationChecked, setMaxRegistrationChecked] = useState(
    !MAX_INIT_DATA
  );

  useEffect(() => {
    if (!MAX_INIT_DATA) return;

    api("/api/auth/max/status", {
      method: "POST",
      body: JSON.stringify({ init_data: MAX_INIT_DATA }),
    })
      .then((result) => {
        if (!result.registered) {
          localStorage.removeItem(SAVED_ACCOUNT_KEY);
          localStorage.removeItem("token");
          setSavedAccount(null);
          setUser(null);
          setToken("");
          return;
        }

        localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(result.user));
        localStorage.setItem("token", result.access_token);
        setSavedAccount(result.user);
        setUser(result.user);
        setToken(result.access_token);
      })
      .catch(() => {
        localStorage.removeItem(SAVED_ACCOUNT_KEY);
        localStorage.removeItem("token");
        setSavedAccount(null);
        setUser(null);
        setToken("");
      })
      .finally(() => setMaxRegistrationChecked(true));
  }, []);

  useEffect(() => {
    if (!savedAccount || !token) {
      return;
    }

    api("/api/auth/me", {}, token)
      .then((remoteUser: User) => {
        setUser({ ...remoteUser, ...savedAccount });
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken("");
      });
  }, [savedAccount, token]);

  useEffect(() => {
    if (!savedAccount || token) {
      return;
    }

    async function restoreBackendSession() {
      try {
        const result = await api(
          "/api/auth/demo",
          {
            method: "POST",
            body: JSON.stringify({
              role: "resident",
              first_name: "Анна",
              last_name: "Иванова",
            }),
          }
        );

        localStorage.setItem("token", result.access_token);
        setToken(result.access_token);
        setUser({ ...result.user, ...savedAccount });
      } catch {
        setUser(savedAccount);
      }
    }

    void restoreBackendSession();
  }, [savedAccount, token]);

  async function completeRegistration(profile: User) {
    if (MAX_INIT_DATA) {
      const result = await api("/api/auth/max/register", {
        method: "POST",
        body: JSON.stringify({
          init_data: MAX_INIT_DATA,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone || "",
          auth_provider: profile.authProvider || "phone",
        }),
      });
      const merged = { ...result.user, ...profile };
      localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(merged));
      localStorage.setItem("token", result.access_token);
      setSavedAccount(merged);
      setUser(merged);
      setToken(result.access_token);
      return;
    }

    localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(profile));
    setSavedAccount(profile);
    setUser(profile);

    try {
      const result = await api("/api/auth/demo", {
        method: "POST",
        body: JSON.stringify({
          role: "resident",
          first_name: "Анна",
          last_name: "Иванова",
        }),
      });

      localStorage.setItem("token", result.access_token);
      setToken(result.access_token);
      const merged = { ...result.user, ...profile };
      localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(merged));
      setSavedAccount(merged);
      setUser(merged);
    } catch {
      // В автономном режиме профиль и демо-данные остаются доступны локально.
    }
  }

  if (!maxRegistrationChecked) {
    return (
      <main className="authShell">
        <section className="authCard">
          <div className="authBrand">
            <span>⌂</span>
            <div><b>Мой Дом</b><small>Проверяем регистрацию…</small></div>
          </div>
        </section>
      </main>
    );
  }

  if (!savedAccount) {
    return <AuthPage onComplete={completeRegistration} />;
  }

  return (
    <HouseProvider token={token}>
      <AppRouter
        token={token}
        user={user}
      />
    </HouseProvider>
  );
}

function AppRouter({
  token,
  user,
}: {
  token: string;
  user: User | null;
}) {
  const {
    joinHouse,
    createRequest,
  } = useHouseStore();

  const [screen, setScreen] =
    useState<Screen>("home");

  const [history, setHistory] =
    useState<Screen[]>([]);

  const [houseId, setHouseId] =
    useState(1);

  const [houseTab, setHouseTab] =
    useState<HouseTab>("События");

  const [eventId, setEventId] =
    useState<number | null>(null);

  const [toast, setToast] =
    useState("");

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(
      () => setToast(""),
      2200
    );
  }

  function go(next: Screen) {
    setHistory((current) => [
      ...current,
      screen,
    ]);
    setScreen(next);
    window.scrollTo(0, 0);
  }

  function back() {
    const nextHistory = [...history];
    const previous =
      nextHistory.pop() || "home";

    setHistory(nextHistory);
    setScreen(previous);
    window.scrollTo(0, 0);
  }

  function selectHouse(
    id: number,
    tab: HouseTab = "События"
  ) {
    setHouseId(id);
    setHouseTab(tab);
    go("house");
  }

  function selectEvent(id: number) {
    setEventId(id);
    go("event-detail");
  }

  async function addHouse(
    id: number,
    relation: string,
    apartment: string
  ) {
    await joinHouse(
      id,
      relation,
      apartment
    );

    showToast("Дом добавлен");
    setScreen("home");
    window.scrollTo(0, 0);
  }

  const content =
    screen === "home" ? (
      <HomePage
        go={go}
        selectHouse={selectHouse}
        selectEvent={selectEvent}
        user={user}
      />
    ) : screen === "feed" ? (
      <FeedPage />
    ) : screen === "profile" ? (
      <ProfilePage
        go={go}
        selectHouse={selectHouse}
        user={user}
      />
    ) : screen === "house" ? (
      <HousePage
        id={houseId}
        initialTab={houseTab}
        onTabChange={setHouseTab}
        back={back}
        go={go}
        selectEvent={selectEvent}
      />
    ) : screen === "add-house" ? (
      <AddHousePage
        back={back}
        done={addHouse}
      />
    ) : screen === "create-request" ? (
      <CreateRequestPage
        back={back}
        buildingId={houseId}
        onSubmit={async (
          category,
          description
        ) => {
          await createRequest(
            houseId,
            category,
            description
          );

          showToast("Заявка создана");
          setHouseTab("Заявки");
          setScreen("house");
        }}
      />
    ) : screen === "notifications" ? (
      <NotificationsPage
        back={back}
      />
    ) : screen === "settings" ? (
      <SettingsPage back={back} />
    ) : screen === "security" ? (
      <SecurityPage back={back} />
    ) : screen === "event-detail" ? (
      <EventDetail
        id={eventId}
        back={back}
        selectHouse={selectHouse}
      />
    ) : null;

  const showNav = [
    "home",
    "feed",
    "profile",
  ].includes(screen);

  return (
    <main className="appShell">
      <div className="content">
        {content}
      </div>

      {showNav && (
        <BottomNav
          screen={screen}
          go={go}
        />
      )}

      <Toast text={toast} />
    </main>
  );
}
