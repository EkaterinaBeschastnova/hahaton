import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_HOUSE_IDS,
  getDemoCatalog,
  getDemoMyHouses,
} from "../data/housesDatabase";
import { ApiError, api } from "../services/api";
import type {
  EventItem,
  House,
  RequestItem,
} from "../types";

type HouseStoreValue = {
  catalog: House[];
  myHouses: House[];
  loading: boolean;
  backendAvailable: boolean;
  refresh: () => Promise<void>;
  getHouseById: (id: number) => House | undefined;
  findEvent: (
    eventId: number
  ) =>
    | { house: House; event: EventItem }
    | undefined;
  joinHouse: (
    houseId: number,
    relation: string,
    apartment: string
  ) => Promise<House>;
  submitMeter: (
    buildingId: number,
    meterId: number,
    value: string
  ) => Promise<void>;
  createRequest: (
    buildingId: number,
    category: string,
    description: string
  ) => Promise<void>;
  createHousePost: (
    buildingId: number,
    title: string,
    body: string,
    postType: "announcement" | "work" | "good" | "useful",
    important: boolean
  ) => Promise<{ maxSent: number; maxFailed: number }>;
  resolveEvent: (
    buildingId: number,
    eventId: number
  ) => Promise<void>;
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
  pinnedHouseIds: number[];
  togglePinnedHouse: (houseId: number) => void;
  removeHouse: (houseId: number) => Promise<void>;
};

const HouseStoreContext =
  createContext<HouseStoreValue | null>(null);

const OFFLINE_HOUSES_KEY =
  "myDomOfflineHousesV3";
const OFFLINE_IDS_KEY =
  "myHouseIdsV3";
const PINNED_HOUSE_IDS_KEY =
  "myDomPinnedHouseIdsV1";
const HIDDEN_HOUSE_IDS_KEY =
  "myDomHiddenHouseIdsV1";

function loadStoredIds(key: string): number[] {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(saved)
      ? saved.map(Number).filter(Number.isFinite)
      : [];
  } catch {
    return [];
  }
}

function applyHousePreferences(houses: House[]) {
  const hidden = new Set(loadStoredIds(HIDDEN_HOUSE_IDS_KEY));
  const pinned = loadStoredIds(PINNED_HOUSE_IDS_KEY);
  const pinnedOrder = new Map(pinned.map((id, index) => [id, index]));

  return houses
    .filter((house) => !hidden.has(house.id))
    .sort((left, right) => {
      const leftPinned = pinnedOrder.get(left.id);
      const rightPinned = pinnedOrder.get(right.id);

      if (leftPinned !== undefined && rightPinned !== undefined) {
        return leftPinned - rightPinned;
      }
      if (leftPinned !== undefined) return -1;
      if (rightPinned !== undefined) return 1;
      return 0;
    });
}

function loadOfflineIds(): number[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem(
        OFFLINE_IDS_KEY
      ) || "[]"
    );

    if (
      Array.isArray(saved) &&
      saved.length > 0
    ) {
      return saved
        .map(Number)
        .filter(Number.isFinite);
    }
  } catch {
    // Используем базовые ID.
  }

  return DEFAULT_HOUSE_IDS;
}

function loadOfflineHouses(): House[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem(
        OFFLINE_HOUSES_KEY
      ) || "null"
    );

    if (Array.isArray(saved)) {
      return applyHousePreferences(saved);
    }
  } catch {
    // Повреждённый кэш не должен ломать приложение.
  }

  return getDemoMyHouses(
    loadOfflineIds()
  );
}

function persistOfflineHouses(
  houses: House[]
) {
  localStorage.setItem(
    OFFLINE_HOUSES_KEY,
    JSON.stringify(houses)
  );

  localStorage.setItem(
    OFFLINE_IDS_KEY,
    JSON.stringify(
      houses.map((house) => house.id)
    )
  );
}

function replaceHouse(
  houses: House[],
  replacement: House
) {
  const exists = houses.some(
    (house) =>
      house.id === replacement.id
  );

  if (!exists) {
    return [...houses, replacement];
  }

  return houses.map((house) =>
    house.id === replacement.id
      ? replacement
      : house
  );
}

export function HouseProvider({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  const [catalog, setCatalog] =
    useState<House[]>(() =>
      getDemoCatalog()
    );

  const [myHouses, setMyHouses] =
    useState<House[]>(() =>
      loadOfflineHouses()
    );

  const [pinnedHouseIds, setPinnedHouseIds] =
    useState<number[]>(() => loadStoredIds(PINNED_HOUSE_IDS_KEY));

  const [loading, setLoading] =
    useState(false);

  const [
    backendAvailable,
    setBackendAvailable,
  ] = useState(false);

  const refresh = useCallback(
    async () => {
      if (!token) {
        return;
      }

      setLoading(true);

      try {
        const [
          remoteCatalog,
          remoteMyHouses,
        ] = await Promise.all([
          api(
            "/api/houses/catalog",
            {},
            token
          ),
          api(
            "/api/houses/my",
            {},
            token
          ),
        ]);

        setCatalog(remoteCatalog);
        setMyHouses(applyHousePreferences(remoteMyHouses));
        setBackendAvailable(true);
      } catch (error) {
        console.warn(
          "Backend домов недоступен, используется локальная демо-база:",
          error
        );

        setBackendAvailable(false);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!token) return;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh, token]);

  const getHouseById = useCallback(
    (id: number) =>
      myHouses.find(
        (house) => house.id === id
      ) ||
      catalog.find(
        (house) => house.id === id
      ),
    [myHouses, catalog]
  );

  const findEvent = useCallback(
    (eventId: number) => {
      for (const house of myHouses) {
        const event =
          house.events.find(
            (item) =>
              item.id === eventId
          );

        if (event) {
          return { house, event };
        }
      }

      return undefined;
    },
    [myHouses]
  );

  const joinHouse = useCallback(
    async (
      houseId: number,
      relation: string,
      apartment: string
    ) => {
      if (
        myHouses.some(
          (house) =>
            house.id === houseId
        )
      ) {
        throw new Error(
          "Этот дом уже добавлен"
        );
      }

      const hiddenIds = loadStoredIds(HIDDEN_HOUSE_IDS_KEY).filter(
        (id) => id !== houseId
      );
      localStorage.setItem(HIDDEN_HOUSE_IDS_KEY, JSON.stringify(hiddenIds));

      if (token) {
        try {
          const remoteHouse =
            await api(
              `/api/houses/${houseId}/join`,
              {
                method: "POST",
                body: JSON.stringify({
                  relation,
                  apartment_number:
                    apartment,
                }),
              },
              token
            );

          setMyHouses((current) =>
            replaceHouse(
              current,
              remoteHouse
            )
          );

          setBackendAvailable(true);
          return remoteHouse;
        } catch (error) {
          if (error instanceof ApiError) {
            throw error;
          }

          console.warn(
            "Backend недоступен, дом будет добавлен в локальную демо-базу:",
            error
          );
        }
      }

      const source =
        catalog.find(
          (house) =>
            house.id === houseId
        );

      if (!source) {
        throw new Error(
          "Дом не найден"
        );
      }

      const localHouse: House = {
        ...structuredClone(source),
        apartment,
        relation,
      };

      setMyHouses((current) => {
        const next = [
          ...current,
          localHouse,
        ];

        persistOfflineHouses(next);
        return next;
      });

      return localHouse;
    },
    [catalog, myHouses, token]
  );

  const togglePinnedHouse = useCallback((houseId: number) => {
    const current = loadStoredIds(PINNED_HOUSE_IDS_KEY);
    const next = current.includes(houseId)
      ? current.filter((id) => id !== houseId)
      : [houseId, ...current];

    localStorage.setItem(PINNED_HOUSE_IDS_KEY, JSON.stringify(next));
    setPinnedHouseIds(next);
    setMyHouses((houses) => {
      const ordered = applyHousePreferences(houses);
      persistOfflineHouses(ordered);
      return ordered;
    });
  }, []);

  const removeHouse = useCallback(
    async (houseId: number) => {
      if (token) {
        try {
          await api(
            `/api/houses/${houseId}/membership`,
            { method: "DELETE" },
            token
          );
          setBackendAvailable(true);
        } catch (error) {
          console.warn(
            "Не удалось удалить дом на backend, скрываем его локально:",
            error
          );
        }
      }

      const hidden = new Set(loadStoredIds(HIDDEN_HOUSE_IDS_KEY));
      hidden.add(houseId);
      localStorage.setItem(HIDDEN_HOUSE_IDS_KEY, JSON.stringify([...hidden]));

      setPinnedHouseIds((current) => {
        const next = current.filter((id) => id !== houseId);
        localStorage.setItem(PINNED_HOUSE_IDS_KEY, JSON.stringify(next));
        return next;
      });

      setMyHouses((current) => {
        const next = current.filter((house) => house.id !== houseId);
        persistOfflineHouses(next);
        return next;
      });
    },
    [token]
  );

  const submitMeter =
    useCallback(
      async (
        buildingId: number,
        meterId: number,
        value: string
      ) => {
        if (token) {
          try {
            const remoteHouse =
              await api(
                `/api/houses/${buildingId}/meters/${meterId}/submit`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    value,
                  }),
                },
                token
              );

            setMyHouses((current) =>
              replaceHouse(
                current,
                remoteHouse
              )
            );

            setCatalog((current) =>
              replaceHouse(
                current,
                remoteHouse
              )
            );

            setBackendAvailable(true);
            return;
          } catch (error) {
            if (error instanceof ApiError) {
              throw error;
            }

            console.warn(
              "Backend недоступен, показания будут изменены локально:",
              error
            );
          }
        }

        setMyHouses((current) => {
          const next = current.map(
            (house) => {
              if (
                house.id !== buildingId
              ) {
                return house;
              }

              return {
                ...house,
                meters:
                  house.meters.map(
                    (meter) =>
                      meter.id === meterId
                        ? {
                            ...meter,
                            lastValue:
                              value,
                            submissionRequired:
                              false,
                            lastSubmittedAt:
                              new Date().toISOString(),
                          }
                        : meter
                  ),
              };
            }
          );

          persistOfflineHouses(next);
          return next;
        });
      },
      [token]
    );

  const createRequest =
    useCallback(
      async (
        buildingId: number,
        category: string,
        description: string
      ) => {
        if (token) {
          try {
            await api(
              "/api/requests",
              {
                method: "POST",
                body: JSON.stringify({
                  building_id:
                    buildingId,
                  category,
                  description,
                }),
              },
              token
            );

            const remoteHouse =
              await api(
                `/api/houses/${buildingId}`,
                {},
                token
              );

            setMyHouses((current) =>
              replaceHouse(
                current,
                remoteHouse
              )
            );

            setBackendAvailable(true);
            return;
          } catch (error) {
            if (error instanceof ApiError) {
              throw error;
            }

            console.warn(
              "Backend недоступен, заявка будет сохранена локально:",
              error
            );
          }
        }

        setMyHouses((current) => {
          const next = current.map(
            (house) => {
              if (
                house.id !== buildingId
              ) {
                return house;
              }

              const localRequest: RequestItem =
                {
                  id:
                    Date.now(),
                  buildingId,
                  category,
                  description,
                  status: "NEW",
                  createdAt:
                    new Date().toISOString(),
                  residents: 1,
                  isMine: true,
                };

              return {
                ...house,
                requests: [
                  localRequest,
                  ...house.requests,
                ],
              };
            }
          );

          persistOfflineHouses(next);
          return next;
        });
      },
      [token]
    );

  const resolveEvent = useCallback(
    async (buildingId: number, eventId: number) => {
      if (token) {
        try {
          const remoteHouse = await api(
            `/api/houses/${buildingId}/events/${eventId}`,
            {
              method: "PATCH",
              body: JSON.stringify({ resolved: true }),
            },
            token
          );

          setMyHouses((current) =>
            replaceHouse(current, remoteHouse)
          );
          setBackendAvailable(true);
          return;
        } catch (error) {
          console.warn(
            "Не удалось закрыть событие на backend, закрываем локально:",
            error
          );
        }
      }

      setMyHouses((current) => {
        const next = current.map((house) =>
          house.id === buildingId
            ? {
                ...house,
                events: house.events.map((event) =>
                  event.id === eventId
                    ? { ...event, resolved: true }
                    : event
                ),
              }
            : house
        );

        persistOfflineHouses(next);
        return next;
      });
    },
    [token]
  );

  const createHousePost = useCallback(
    async (
      buildingId: number,
      title: string,
      body: string,
      postType: "announcement" | "work" | "good" | "useful",
      important: boolean
    ) => {
      if (token) {
        try {
          const result = await api(
            `/api/houses/${buildingId}/posts`,
            {
              method: "POST",
              body: JSON.stringify({
                title,
                body,
                post_type: postType,
                important,
              }),
            },
            token
          );

          setMyHouses((current) =>
            replaceHouse(current, result.house)
          );
          setCatalog((current) =>
            replaceHouse(current, result.house)
          );
          setBackendAvailable(true);
          return {
            maxSent: Number(result.maxSent || 0),
            maxFailed: Number(result.maxFailed || 0),
          };
        } catch (error) {
          if (error instanceof ApiError) {
            throw error;
          }

          console.warn(
            "Backend недоступен, пост будет сохранён локально:",
            error
          );
        }
      }

      const localEvent: EventItem = {
        id: Date.now(),
        buildingId,
        type: postType,
        severity: important ? "attention" : "info",
        title,
        body,
        date: "Сегодня",
        icon: important ? "!" : "▤",
        requiresAttention: important,
        resolved: false,
      };

      setMyHouses((current) => {
        const next = current.map((house) =>
          house.id === buildingId
            ? { ...house, events: [localEvent, ...house.events] }
            : house
        );
        persistOfflineHouses(next);
        return next;
      });

      return { maxSent: 0, maxFailed: 0 };
    },
    [token]
  );

  const joinRequest = useCallback(
    async (buildingId: number, requestId: number) => {
      if (token) {
        try {
          const remoteHouse = await api(
            `/api/houses/${buildingId}/requests/${requestId}/join`,
            { method: "POST" },
            token
          );

          setMyHouses((current) =>
            replaceHouse(current, remoteHouse)
          );
          setBackendAvailable(true);
          return;
        } catch (error) {
          console.warn(
            "Не удалось присоединиться на backend, обновляем локально:",
            error
          );
        }
      }

      setMyHouses((current) => {
        const next = current.map((house) =>
          house.id === buildingId
            ? {
                ...house,
                requests: house.requests.map((request) =>
                  request.id === requestId && !request.isMine
                    ? {
                        ...request,
                        isMine: true,
                        residents: (request.residents || 1) + 1,
                      }
                    : request
                ),
              }
            : house
        );

        persistOfflineHouses(next);
        return next;
      });
    },
    [token]
  );

  const updateRequest = useCallback(
    async (
      buildingId: number,
      requestId: number,
      category: string,
      description: string
    ) => {
      if (token) {
        try {
          const remoteHouse = await api(
            `/api/houses/${buildingId}/requests/${requestId}`,
            {
              method: "PATCH",
              body: JSON.stringify({ category, description }),
            },
            token
          );

          setMyHouses((current) =>
            replaceHouse(current, remoteHouse)
          );
          setBackendAvailable(true);
          return;
        } catch (error) {
          console.warn(
            "Не удалось изменить заявку на backend, обновляем локально:",
            error
          );
        }
      }

      setMyHouses((current) => {
        const next = current.map((house) =>
          house.id === buildingId
            ? {
                ...house,
                requests: house.requests.map((request) =>
                  request.id === requestId
                    ? { ...request, category, description }
                    : request
                ),
              }
            : house
        );

        persistOfflineHouses(next);
        return next;
      });
    },
    [token]
  );

  const value = useMemo(
    () => ({
      catalog,
      myHouses,
      loading,
      backendAvailable,
      refresh,
      getHouseById,
      findEvent,
      joinHouse,
      submitMeter,
      createRequest,
      createHousePost,
      resolveEvent,
      joinRequest,
      updateRequest,
      pinnedHouseIds,
      togglePinnedHouse,
      removeHouse,
    }),
    [
      catalog,
      myHouses,
      loading,
      backendAvailable,
      refresh,
      getHouseById,
      findEvent,
      joinHouse,
      submitMeter,
      createRequest,
      createHousePost,
      resolveEvent,
      joinRequest,
      updateRequest,
      pinnedHouseIds,
      togglePinnedHouse,
      removeHouse,
    ]
  );

  return (
    <HouseStoreContext.Provider
      value={value}
    >
      {children}
    </HouseStoreContext.Provider>
  );
}

export function useHouseStore() {
  const context = useContext(
    HouseStoreContext
  );

  if (!context) {
    throw new Error(
      "useHouseStore must be used inside HouseProvider"
    );
  }

  return context;
}
