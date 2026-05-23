import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";

export default function InvoiceDetail() {
  const { id } = useParams();
  const [inv, setInv] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("invoices").select("*, clients(*)").eq("id", id!).single();
    setInv(data);
    const { data: its } = await supabase.from("invoice_items").select("*").eq("invoice_id", id!);
    setItems(its || []);
  };
  useEffect(() => { load(); }, [id]);

  const setStatus = async (status: string) => {
    await supabase.from("invoices").update({ status }).eq("id", id!);
    toast.success(`Marked as ${status}`);
    load();
  };

  if (!inv) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/invoices" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setStatus("sent")}>Mark sent</Button>
          <Button variant="outline" size="sm" onClick={() => setStatus("paid")}>Mark paid</Button>
          <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
        </div>
      </div>

      <Card className="bg-card print:bg-white print:text-black">
        <div className="flex justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl">Invoice</h1>
            <p className="text-muted-foreground mt-1">{inv.invoice_number}</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-muted-foreground">Issued</div>
            <div className="mb-2">{formatDate(inv.issue_date)}</div>
            <div className="text-muted-foreground">Due</div>
            <div>{formatDate(inv.due_date)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Billed to</div>
            <div className="font-medium">{inv.clients?.name || "—"}</div>
            {inv.clients?.company && <div className="text-muted-foreground">{inv.clients.company}</div>}
            {inv.clients?.email && <div className="text-muted-foreground">{inv.clients.email}</div>}
            {inv.clients?.address && <div className="text-muted-foreground whitespace-pre-line">{inv.clients.address}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Status</div>
            <div className="font-medium capitalize">{inv.status}</div>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead className="text-left text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border">
            <tr><th className="py-3">Description</th><th className="py-3 text-right">Qty</th><th className="py-3 text-right">Price</th><th className="py-3 text-right">Amount</th></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-border/50">
                <td className="py-3">{i.description}</td>
                <td className="py-3 text-right">{i.quantity}</td>
                <td className="py-3 text-right">{formatCurrency(i.unit_price)}</td>
                <td className="py-3 text-right">{formatCurrency(i.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(inv.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(inv.tax)}</span></div>
            <div className="flex justify-between font-display text-xl pt-2 border-t border-border"><span>Total</span><span>{formatCurrency(inv.total)}</span></div>
          </div>
        </div>

        {inv.notes && (
          <div className="mt-10 pt-6 border-t border-border text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Notes</div>
            <p className="text-muted-foreground whitespace-pre-line">{inv.notes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}