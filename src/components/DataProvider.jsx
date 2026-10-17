import { createContext, useContext, useMemo, useState } from "react";
import { getInitialData } from "../utils/loadData";
import { computeRarities } from "../utils/rarity";

const DataContext = createContext(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData должен вызываться внутри <DataProvider>");
  return ctx;
}

// Данные приходят из сборки и не меняются в браузере: живая сверка с таблицей убрана
// 17.10.2026 — она не могла достать гиперссылки и тянула 250+ КБ с Google на каждый визит.
export function DataProvider({ children }) {
  const [data] = useState(() => getInitialData());

  const value = useMemo(() => {
    const rarities = computeRarities(data.games, data.collections);
    return { ...data, ...rarities };
  }, [data]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
