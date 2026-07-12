import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

export function Header() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 text-slate-500 hover:text-slate-700 md:hidden p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Global Search */}
        <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
          <Search className="h-4 w-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search assets, users..." 
            className="bg-transparent border-none focus:outline-none text-sm text-slate-900 w-64 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-slate-600 relative p-1">
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button
          onClick={handleSignOut}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
