import { Home, Plus, Code, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const menuItems = [
  {
    title: "الرئيسية",
    url: "/",
    icon: Home,
  },
  {
    title: "إضافة رقم",
    url: "/add-number",
    icon: Plus,
  },
  {
    title: "Docs API",
    url: "/api-docs",
    icon: Code,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, logoutPending } = useAuth();

  return (
    <Sidebar side="right" className="border-l border-white/5 bg-black text-white">
      <SidebarHeader className="p-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/40"
          >
            <span className="text-white font-bold text-xl">WA</span>
          </motion.div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight">WhatsApp Bot</span>
            <span className="text-xs text-zinc-400">لوحة التحكم</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-12 w-full justify-start gap-4 px-4 rounded-xl transition-all duration-300 ${isActive
                        ? "bg-gradient-to-r from-red-600/20 to-transparent text-red-500 border-r-2 border-red-500"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                        }`}
                    >
                      <Link href={item.url} data-testid={`link-${item.url.replace("/", "") || "home"}`}>
                        <item.icon className={`w-5 h-5 ${isActive ? "text-red-500 font-bold" : ""}`} />
                        <span className="font-medium text-base">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 bg-black/50">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
          <Avatar className="w-10 h-10 border border-white/10">
            <AvatarFallback className="bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-300 font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" data-testid="text-email">
              {user?.email}
            </p>
            <p className="text-xs text-zinc-500">مستخدم نشط</p>
          </div>
        </div>
        <Button
          variant="destructive"
          className="w-full gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 hover:border-red-500/50 transition-all font-medium"
          onClick={() => logout()}
          disabled={logoutPending}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
