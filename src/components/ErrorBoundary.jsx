import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="card max-w-md p-8 text-center">
            <div className="text-5xl">🥐</div>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-ink">
              Кроассан упал в обморок
            </h2>
            <p className="mt-2 text-sm text-ink-dim">
              Что-то пошло не так. Перезагрузи страницу — обычно это лечит.
            </p>
            <button
              type="button"
              className="btn-primary mt-6"
              onClick={() => window.location.reload()}
            >
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
