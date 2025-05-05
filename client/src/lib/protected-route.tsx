import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route, RouteComponentProps } from "wouter";
import { Loader2 } from "lucide-react";

// Development bypass flag - set to true to bypass auth checks
const BYPASS_AUTH = true;

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({
  path,
  component: Component,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (BYPASS_AUTH) {
    // In development mode, bypass authentication checks
    // Use a wrapper component to handle route params
    const ComponentWrapper = (props: RouteComponentProps) => <Component {...props} />;
    return <Route path={path} component={ComponentWrapper} />;
  }

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Create a render function that accepts route params
        return <Component {...(window.location.pathname.match(path) || {})} />;
      }}
    </Route>
  );
}