"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Image from "next/image";
import { Menu } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-0 md:ml-64 transition-all duration-300">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 md:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={22} className="text-gray-700" />
          </button>
          <Image
            src="/logo-progresa.png"
            alt="Progresa Agencia"
            width={120}
            height={48}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
