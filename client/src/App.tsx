import { Switch, Route, Redirect, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AddNumber from "@/pages/AddNumber";
import ApiDocs from "@/pages/ApiDocs";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex min-h-screen w-full bg-background text-foreground" dir="rtl">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden flex flex-col">
          <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-zinc-400">System Online</span>
            </div>
            <SidebarTrigger className="text-white hover:bg-white/10" data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto relative">
            {/* Background Gradients for every page */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-20">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-900/30 rounded-full blur-[150px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[150px]" />
            </div>
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedRoutes() {
  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/add-number" component={AddNumber} />
        <Route path="/api-docs" component={ApiDocs} />
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route>
        {isAuthenticated ? <AuthenticatedRoutes /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Toaster />
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
