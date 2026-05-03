import { Component, ReactNode, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background">
          <div className="text-center space-y-4 max-w-sm">
            <div className="h-16 w-16 rounded-full bg-destructive/10 grid place-items-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="font-display text-2xl text-foreground">
              Algo deu errado
            </h1>
            <p className="text-muted-foreground text-sm">
              Ocorreu um erro inesperado. Por favor, tente novamente.
            </p>
            {this.state.error && (
              <details className="text-left text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32">
                <summary className="cursor-pointer text-muted-foreground">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => window.location.href = "/"} className="flex-1">
                Ir para início
              </Button>
              <Button onClick={this.handleRetry} className="flex-1 bg-brand">
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}