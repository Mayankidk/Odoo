import { NavLink } from "react-router-dom";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { 
  LayoutDashboard, 
  Package, 
  CalendarDays, 
  Wrench, 
  Settings,
  Users,
  X,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  roles?: string[]; // If omitted, all roles can see it
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Organization Setup', href: '/settings', icon: Settings },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Allocation & Transfer', href: '/assets', icon: Users },
  { name: 'Resource Booking', href: '/bookings', icon: CalendarDays },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Audit', href: '/audits', icon: ShieldCheck },
  { name: 'Reports', href: '/analytics', icon: TrendingUp },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'asset_manager'] },
];

export function Sidebar() {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const role = profile?.role;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const filteredNav = navigation.filter(item => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

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
        {filteredNav.map((item) => (
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
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            <span className="text-sm font-medium text-slate-600">{getInitials(user?.email)}</span>
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-medium text-slate-900 truncate">
              {user?.email || 'Unknown User'}
            </span>
            <span className="text-xs text-slate-500 capitalize">{role || 'User'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 ml-1"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
