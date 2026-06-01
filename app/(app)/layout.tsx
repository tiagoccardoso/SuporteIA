import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <div className="min-h-screen md:flex"><Sidebar user={user} /><main className="flex-1 p-5 md:p-8">{children}</main></div>;
}
