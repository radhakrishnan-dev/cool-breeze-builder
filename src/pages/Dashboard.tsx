import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { Receipt, FileText, Users, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ expenses: 0, invoiced: 0, paid: 0, clients: 0 });

  useEffect(() => {
    (async () => {
      const [exp, inv, cli] = await Promise.all([
        supabase.from("expenses").select("amount"),
        supabase.from("invoices").select("total, status"),
        supabase.from("clients").select("id"),
      ]);
      const expenses = (exp.data || []).reduce((s, r: any) => s + Number(r.amount), 0);
      const invoiced = (inv.data || []).reduce((s, r: any) => s + Number(r.total), 0);
      const paid = (inv.data || []).filter((r: any) => r.status === "paid").reduce((s, r: any) => s + Number(r.total), 0);
      setStats({ expenses, invoiced, paid, clients: cli.data?.length || 0 });
    })();
  }, []);

  const items = [
    { label: "Total Invoiced", value: formatCurrency(stats.invoiced), icon: FileText },
    { label: "Revenue Collected", value: formatCurrency(stats.paid), icon: TrendingUp },
    { label: "Total Expenses", value: formatCurrency(stats.expenses), icon: Receipt },
    { label: "Clients", value: String(stats.clients), icon: Users },
  ];

  return (
    <div>
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Overview</p>
        <h1 className="font-display text-4xl">Good day.</h1>
        <p className="text-muted-foreground mt-2">A quiet, complete view of your agency operations.</p>
      </header>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((s) => (
          <Card key={s.label}>
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="font-display text-3xl">{s.value}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}