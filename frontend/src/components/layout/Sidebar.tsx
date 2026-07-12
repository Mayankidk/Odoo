import { NavLink } from "react-router-dom";
import { useUiStore } from "@/stores/uiStore";
import { 
  LayoutDashboard, 
  Package, 
  CalendarDays, 
  Wrench, 
  Settings, 
  Users,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Bookings', href: '/bookings', icon: CalendarDays },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 shadow-sm md:shadow-none flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-slate-900 tracking-tight">AssetFlow</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setSidebarOpen(false)} // Close sidebar on mobile on nav click
            className={({ isActive }) => cn(
              "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
              isActive 
                ? "bg-blue-50 text-blue-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200",
                    isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600"
                  )} 
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
            {/* Placeholder avatar */}
            <span className="text-sm font-medium text-slate-600">JD</span>
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-medium text-slate-900 truncate">John Doe</span>
            <span className="text-xs text-slate-500 truncate">Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
