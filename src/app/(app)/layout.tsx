import Sidebar from "@/components/Sidebar";
import { ClientProvider } from "@/lib/client-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen ml-64 transition-all duration-300">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ClientProvider>
  );
}
