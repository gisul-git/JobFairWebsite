import { redirect } from "next/navigation";

import { auth } from "@/auth";
import LuckyDrawPanel from "@/components/admin/LuckyDrawPanel";
import StatsCards from "@/components/admin/StatsCards";
import UsersTable from "@/components/admin/UsersTable";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || !session.user.isAdmin) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-[#080a1a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(105,82,162,0.25),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(244,228,1,0.08),transparent_40%)]" />
      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-white/10 bg-[#0f1222]/95 p-4 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
          <div className="text-xl font-black tracking-wide text-primary">GISUL Admin</div>
          <div className="mt-1 text-xs text-cream/70">Control center</div>
          <nav className="mt-4 flex flex-wrap gap-2 text-sm font-semibold lg:mt-8 lg:block lg:space-y-2 lg:gap-0">
            <a className="block rounded-lg border border-transparent px-3 py-2 text-white/90 transition hover:border-white/15 hover:bg-white/5" href="#dashboard">
              Dashboard
            </a>
            <a className="block rounded-lg border border-transparent px-3 py-2 text-white/90 transition hover:border-white/15 hover:bg-white/5" href="#users">
              Users
            </a>
            <a className="block rounded-lg border border-transparent px-3 py-2 text-white/90 transition hover:border-white/15 hover:bg-white/5" href="#lucky-draw">
              Lucky Draw
            </a>
            <a className="block rounded-lg border border-transparent px-3 py-2 text-white/90 transition hover:border-white/15 hover:bg-white/5" href="#users">
              Export
            </a>
          </nav>
        </aside>

        <div className="flex-1 p-4 sm:p-6">
          <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
            <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <h1 className="text-xl font-extrabold text-white sm:text-2xl">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-cream/80">Monitor candidates, export assessments, and manage lucky draw from one place.</p>
            </header>
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

