import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const CATEGORIES = ["Software", "Travel", "Meals", "Office", "Marketing", "Contractors", "Other"];

export default function Expenses() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "Software", description: "", expense_date: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("expenses").insert({
      user_id: u.user.id,
      amount: parseFloat(form.amount),
      category: form.category,
      description: form.description,
      expense_date: form.expense_date,
    });
    if (error) return toast.error(error.message);
    toast.success("Expense logged");
    setForm({ amount: "", category: "Software", description: "", expense_date: new Date().toISOString().slice(0, 10) });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    load();
  };

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Spend</p>
          <h1 className="font-display text-4xl">Expense Tracker</h1>
          <p className="text-muted-foreground mt-2">Total tracked: <span className="text-foreground">{formatCurrency(total)}</span></p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Log expense</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-6 py-4">{formatDate(r.expense_date)}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-accent/40 text-xs">{r.category}</span></td>
                <td className="px-6 py-4 text-muted-foreground">{r.description || "—"}</td>
                <td className="px-6 py-4 text-right font-medium">{formatCurrency(r.amount)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">No expenses yet.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New expense">
        <form onSubmit={save} className="space-y-3">
          <Input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <select className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
          <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button type="submit" className="w-full">Save expense</Button>
        </form>
      </Modal>
    </div>
  );
}