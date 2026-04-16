import { redirect } from "next/navigation";

import { auth } from "@/auth";
import LuckyDrawPanel from "@/components/admin/LuckyDrawPanel";
import StatsCards from "@/components/admin/StatsCards";
import UsersTable from "@/components/admin/UsersTable";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-dark">
      <div className="flex min-h-screen">
        <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0f0f1a] p-6">
          <div className="text-lg font-extrabold tracking-wide text-primary">GISUL Admin</div>
          <nav className="mt-8 space-y-2 text-sm font-semibold">
            <a className="block rounded-lg px-3 py-2 text-white/90 hover:bg-white/5" href="#dashboard">
              Dashboard
            </a>
            <a className="block rounded-lg px-3 py-2 text-white/90 hover:bg-white/5" href="#users">
              Users
            </a>
            <a className="block rounded-lg px-3 py-2 text-white/90 hover:bg-white/5" href="#lucky-draw">
              Lucky Draw
            </a>
            <a className="block rounded-lg px-3 py-2 text-white/90 hover:bg-white/5" href="#export">
              Export
            </a>
          </nav>
        </aside>

        <div className="flex-1 p-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <section id="dashboard">
              <StatsCards />
            </section>
            <section id="users">
              <UsersTable />
            </section>
            <section id="lucky-draw">
              <LuckyDrawPanel />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

