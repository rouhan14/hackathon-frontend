import AuthGuard from "@/components/auth-guard";
import SignOutButton from "./sign-out-button";
import UserGreeting from "./user-greeting";
import NotionCard from "./notion-card";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
        <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.12]">
          <span className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
            Dashboard
          </span>
          <SignOutButton />
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16">
          <div className="flex flex-col gap-3">
            <UserGreeting />
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              This is your landing page. Everything below is placeholder content
              to show you made it past the login screen.
            </p>
          </div>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Integrations
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <NotionCard />
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
