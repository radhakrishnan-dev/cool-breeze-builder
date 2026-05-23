import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Sparkles, Receipt, FileText, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="px-8 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-gradient-premium grid place-items-center shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl">Lumen</span>
        </div>
        <Link to="/auth"><Button variant="outline" size="sm">Sign in</Button></Link>
      </header>

      <section className="max-w-5xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Agency Operations, Refined
        </div>
        <h1 className="font-display text-6xl md:text-7xl leading-[1.05] mb-6">
          A premium portal for<br />modern agencies.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Manage clients, track every expense, and ship invoices that look as considered as the work itself.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/auth"><Button size="lg">Get started</Button></Link>
          <a href="#features"><Button size="lg" variant="outline">Explore</Button></a>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-8 pb-32 grid md:grid-cols-3 gap-6">
        {[
          { icon: Receipt, title: "Expense Tracker", body: "Capture every cost with categories, dates, and clean reporting." },
          { icon: FileText, title: "Billing & Invoices", body: "Compose elegant invoices, track status, and print-ready PDFs." },
          { icon: Shield, title: "Admin Panel", body: "Oversee users, roles, and revenue across the entire workspace." },
        ].map((f) => (
          <div key={f.title} className="premium-card">
            <f.icon className="h-6 w-6 text-primary mb-4" />
            <h3 className="text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumen Portal
      </footer>
    </div>
  );
}