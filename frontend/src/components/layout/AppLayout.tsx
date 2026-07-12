import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUiStore } from "@/stores/uiStore";

export function AppLayout() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0 transition-all duration-300">
        <Header />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-slate-50">
          <div className="mx-auto max-w-7xl">
            {/* The routed content goes here */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
