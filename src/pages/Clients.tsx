import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export default function Clients() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", address: "" });

  const load = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("clients").insert({ ...form, user_id: u.user.id });
    if (error) return toast.error(error.message);
    toast.success("Client added");
    setForm({ name: "", email: "", company: "", phone: "", address: "" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("clients").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Directory</p>
          <h1 className="font-display text-4xl">Clients</h1>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add client</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rows.map((c) => (
          <Card key={c.id}>
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg">{c.name}</h3>
                {c.company && <p className="text-sm text-muted-foreground">{c.company}</p>}
              </div>
              <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 text-sm space-y-1 text-muted-foreground">
              {c.email && <div>{c.email}</div>}
              {c.phone && <div>{c.phone}</div>}
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">No clients yet.</p>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New client">
        <form onSubmit={save} className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Textarea placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Button type="submit" className="w-full">Save client</Button>
        </form>
      </Modal>
    </div>
  );
}