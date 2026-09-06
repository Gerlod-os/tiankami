import { Routes, Route, Link } from "react-router-dom";
import { Layout } from "./components/Layout";
import { DataProvider } from "./components/DataProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { GamePage } from "./pages/GamePage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { CollectionPage } from "./pages/CollectionPage";
import { AboutPage } from "./pages/AboutPage";
import { SchedulePage } from "./pages/SchedulePage";
import { MIPage } from "./pages/MIPage";

function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <div className="text-5xl">🥐</div>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">404 — крошка не найдена</h1>
      <p className="mt-2 text-sm text-ink-dim">Такой страницы нет. Но каталог никуда не делся!</p>
      <Link to="/" className="btn-primary mt-6">На главную</Link>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:slug" element={<GamePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:slug" element={<CollectionPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/mi" element={<MIPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </DataProvider>
    </ErrorBoundary>
  );
}
