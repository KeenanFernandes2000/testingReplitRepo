import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Upload from "@/pages/upload";
import Discover from "@/pages/discover";
import Auth from "@/pages/auth";
import { AuthProvider } from "@/lib/auth.tsx";

// Development mode - no authentication checks
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/profile/:username?" component={Profile} />
      <Route path="/upload" component={Upload} />
      <Route path="/discover" component={Discover} />
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
