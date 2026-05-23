import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Users, Receipt, FileText, Shield, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/invoices", label: "Invoices", icon: FileText },
];

export default function AppLayout() {
  const { signOut, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="px-6 py-7 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-premium grid place-items-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-lg leading-none">Lumen</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Agency Portal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-secondary"
            )}>
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors mt-4",
              isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-secondary"
            )}>
              <Shield className="h-4 w-4" /> Admin
            </NavLink>
          )}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <button onClick={async () => { await signOut(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-secondary text-sidebar-foreground">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}