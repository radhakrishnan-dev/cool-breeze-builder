import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type LineItem = { description: string; quantity: number; unit_price: number };

export default function Invoices() {
  const [rows, setRows] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    invoice_number: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    tax_rate: "0",
    notes: "",
  });
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  const load = async () => {
    const { data } = await supabase.from("invoices").select("*, clients(name)").order("created_at", { ascending: false });
    setRows(data || []);
    const { data: cli } = await supabase.from("clients").select("id, name");
    setClients(cli || []);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (open && !form.invoice_number) {
      setForm((f) => ({ ...f, invoice_number: `INV-${Date.now().toString().slice(-6)}` }));
    }
  }, [open]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const tax = subtotal * (parseFloat(form.tax_rate) || 0) / 100;
  const total = subtotal + tax;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: inv, error } = await supabase.from("invoices").insert({
      user_id: u.user.id,
      client_id: form.client_id || null,
      invoice_number: form.invoice_number,
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      subtotal, tax, total,
      notes: form.notes,
      status: "draft",
    }).select().single();
    if (error) return toast.error(error.message);
    if (inv && items.length) {
      await supabase.from("invoice_items").insert(items.map((i) => ({
        invoice_id: inv.id, description: i.description, quantity: i.quantity, unit_price: i.unit_price, amount: i.quantity * i.unit_price,
      })));
    }
    toast.success("Invoice created");
    setOpen(false);
    setItems([{ description: "", quantity: 1, unit_price: 0 }]);
    setForm({ client_id: "", invoice_number: "", issue_date: new Date().toISOString().slice(0, 10), due_date: "", tax_rate: "0", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
    load();
  };

  const statusBadge = (s: string) => {
    const map: any = { draft: "bg-secondary text-secondary-foreground", sent: "bg-accent text-accent-foreground", paid: "bg-primary/20 text-primary", overdue: "bg-destructive/20 text-destructive" };
    return <span className={`px-2 py-1 rounded text-xs ${map[s] || map.draft}`}>{s}</span>;
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Billing</p>
          <h1 className="font-display text-4xl">Invoices</h1>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New invoice</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4">Number</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Issued</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-6 py-4"><Link to={`/invoices/${r.id}`} className="hover:text-primary">{r.invoice_number}</Link></td>
                <td className="px-6 py-4 text-muted-foreground">{r.clients?.name || "—"}</td>
                <td className="px-6 py-4">{formatDate(r.issue_date)}</td>
                <td className="px-6 py-4">{statusBadge(r.status)}</td>
                <td className="px-6 py-4 text-right font-medium">{formatCurrency(r.total)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New invoice">
        <form onSubmit={save} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input placeholder="Invoice #" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} required />
          <select className="flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
            <option value="">No client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            <Input type="date" placeholder="Due" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Items</div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <Input className="col-span-6" placeholder="Description" value={it.description} onChange={(e) => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} />
                <Input className="col-span-2" type="number" step="0.01" placeholder="Qty" value={it.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = parseFloat(e.target.value) || 0; setItems(n); }} />
                <Input className="col-span-3" type="number" step="0.01" placeholder="Price" value={it.unit_price} onChange={(e) => { const n = [...items]; n[idx].unit_price = parseFloat(e.target.value) || 0; setItems(n); }} />
                <button type="button" className="col-span-1 text-muted-foreground hover:text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 mx-auto" /></button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setItems([...items, { description: "", quantity: 1, unit_price: 0 }])}>+ Add line</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <Input type="number" step="0.01" placeholder="Tax %" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</div>
              <div className="text-muted-foreground">Tax: {formatCurrency(tax)}</div>
              <div className="font-display text-lg">Total: {formatCurrency(total)}</div>
            </div>
          </div>
          <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" className="w-full">Create invoice</Button>
        </form>
      </Modal>
    </div>
  );
}