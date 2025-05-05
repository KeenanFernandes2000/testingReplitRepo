import { useAuth } from "@/hooks/use-auth";
import { Route, RouteComponentProps } from "wouter";

// Set to true to completely disable authentication checks in development
const BYPASS_AUTH = true;

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function ProtectedRoute({
  path,
  component: Component,
}: ProtectedRouteProps) {
  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}