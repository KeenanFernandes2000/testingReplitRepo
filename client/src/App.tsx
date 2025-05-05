import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Upload from "@/pages/upload";
import Discover from "@/pages/discover";
import Auth from "@/pages/auth";
import { AuthProvider } from "@/lib/auth.tsx";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/profile/:username?" component={Profile} />
      <ProtectedRoute path="/upload" component={Upload} />
      <ProtectedRoute path="/discover" component={Discover} />
      <Route path="/auth" component={Auth} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
