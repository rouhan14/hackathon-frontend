import AuthGuard from "@/components/auth-guard";
import AppShell from "@/components/shell/app-shell";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { WorkOsProvider } from "@/components/providers/work-os-provider";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ThemeProvider>
        <WorkOsProvider>
          <AppShell>{children}</AppShell>
        </WorkOsProvider>
      </ThemeProvider>
    </AuthGuard>
  );
}
