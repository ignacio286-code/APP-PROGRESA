import AppShell from "@/components/AppShell";
import { ClientProvider } from "@/lib/client-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProvider>
      <AppShell>{children}</AppShell>
    </ClientProvider>
  );
}
