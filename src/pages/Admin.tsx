import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [stats, setStats] = useState({ users: 0, expenses: 0, invoices: 0, revenue: 0 });

  const load = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: r } = await supabase.from("user_roles").select("user_id, role");
    const { data: exp } = await supabase.from("expenses").select("amount");
    const { data: inv } = await supabase.from("invoices").select("total, status");
    const map: Record<string, string[]> = {};
    (r || []).forEach((row: any) => { (map[row.user_id] ||= []).push(row.role); });
    setRoles(map);
    setUsers(profiles || []);
    setStats({
      users: profiles?.length || 0,
      expenses: (exp || []).reduce((s, x: any) => s + Number(x.amount), 0),
      invoices: inv?.length || 0,
      revenue: (inv || []).filter((x: any) => x.status === "paid").reduce((s, x: any) => s + Number(x.total), 0),
    });
  };
  useEffect(() => { load(); }, []);

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      toast.success("Admin removed");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      toast.success("Admin granted");
    }
    load();
  };

  return (
    <div>
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Workspace</p>
        <h1 className="font-display text-4xl">Admin</h1>
      </header>
      <div className="grid md:grid-cols-4 gap-5 mb-10">
        <Card><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Users</div><div className="font-display text-3xl">{stats.users}</div></Card>
        <Card><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Invoices</div><div className="font-display text-3xl">{stats.invoices}</div></Card>
        <Card><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Revenue</div><div className="font-display text-3xl">{formatCurrency(stats.revenue)}</div></Card>
        <Card><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Expenses</div><div className="font-display text-3xl">{formatCurrency(stats.expenses)}</div></Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
            <tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Joined</th><th className="px-6 py-4">Roles</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const userRoles = roles[u.id] || ["user"];
              const isAdmin = userRoles.includes("admin");
              return (
                <tr key={u.id} className="border-b border-border/50">
                  <td className="px-6 py-4">
                    <div>{u.full_name || "—"}</div>
                    <div className="text-muted-foreground text-xs">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">{formatDate(u.created_at)}</td>
                  <td className="px-6 py-4">
                    {userRoles.map((r) => <span key={r} className="px-2 py-1 mr-1 rounded bg-accent/40 text-xs">{r}</span>)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant={isAdmin ? "outline" : "primary"} onClick={() => toggleAdmin(u.id, isAdmin)}>
                      {isAdmin ? "Revoke admin" : "Make admin"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}