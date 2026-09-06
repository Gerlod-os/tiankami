import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getInitialData,
  maybeRefresh,
  forceRefresh,
  clearCache,
} from "../utils/loadData";
import { computeRarities } from "../utils/rarity";
import { afterLoad } from "../utils/idle";

const DataContext = createContext(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData должен вызываться внутри <DataProvider>");
  return ctx;
}

export function DataProvider({ children }) {
  const [data, setData] = useState(() => getInitialData());
  const [refreshing, setRefreshing] = useState(false);

  // Фоновая сверка с Google Таблицей (SWR), не чаще раза в 15 минут.
  // Отложена через afterLoad — не конкурирует со шрифтами/обложками (Lighthouse).
  useEffect(() => {
    let alive = true;
    const stop = afterLoad(
      () => {
        maybeRefresh()
          .then((fresh) => {
            if (alive && fresh) setData(fresh);
          })
          .catch(() => {
            /* офлайн — работаем на локальных данных */
          });
      },
      { minIdle: 10000 }
    );
    return () => {
      alive = false;
      stop();
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await forceRefresh();
      if (fresh) setData(fresh);
    } catch {
      /*ignore*/
    } finally {
      setRefreshing(false);
    }
  }, []);

  const resetCache = useCallback(() => {
    clearCache();
    setData(getInitialData());
  }, []);

  const value = useMemo(() => {
    const rarities = computeRarities(data.games, data.collections);
    return {
      ...data,
      ...rarities,
      refresh,
      refreshing,
      resetCache,
    };
  }, [data, refresh, refreshing, resetCache]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
