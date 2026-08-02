"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/ux/copy";
import { reportError } from "@/lib/monitoring/report";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; resetKey: number };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    reportError(error, "error-boundary");
  }

  private handleReset = () => {
    this.setState((prev) => ({ hasError: false, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center"
            role="alert"
          >
            <h2 className="text-lg font-semibold">{copy.gates.boundary.title}</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {copy.gates.boundary.description}
            </p>
            <Button onClick={this.handleReset}>{copy.gates.boundary.retry}</Button>
          </div>
        )
      );
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
