import Link from "next/link";
import { logoutAction } from "@/app/actions";
import type { users } from "@/db/schema";

const items = [
  ["/dashboard", "Dashboard"], ["/systems", "Sistemas"], ["/knowledge", "Base de conhecimento"], ["/documents", "Documentos"], ["/chat", "Chat IA"], ["/tickets", "Tickets"], ["/insights", "Insights"], ["/settings/ai", "Config. IA"]
];

export function Sidebar({ user }: { user: typeof users.$inferSelect }) {
  return (
    <aside className="flex min-h-screen w-full flex-col border-r border-slate-200 bg-slate-950 p-5 text-white md:w-72">
      <div className="mb-8">
        <div className="text-xl font-black">SupportAI Hub</div>
        <div className="text-sm text-slate-400">Suporte interno com RAG</div>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {items.map(([href, label]) => <Link className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10" href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="rounded-2xl bg-white/10 p-3 text-sm">
        <strong>{user.name}</strong><br /><span className="text-slate-300">{user.role}</span>
        <form action={logoutAction} className="mt-3"><button className="text-slate-300 hover:text-white">Sair</button></form>
      </div>
    </aside>
  );
}
