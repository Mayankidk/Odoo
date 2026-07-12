import { Bell, LogOut, Menu, Search, Check, CheckSquare, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/queries/useNotifications";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

export function Header() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const { data: notifications = [] } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const unreadNotifications = notifications.filter((n: any) => !n.is_read);
  const unreadCount = unreadNotifications.length;

  // Real-time subscription to notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          // Display the visual banner / alert toast
          toast.success(payload.new.title, {
            description: payload.new.message,
            duration: 5000,
          });
          // Invalidate React Query cache to fetch new list
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    clearSession();
    navigate("/login", { replace: true });
  }

  function handleMarkRead(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    markRead(id);
  }

  function handleMarkAllRead() {
    markAllRead();
    toast.success("All notifications marked as read");
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 6000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function getNotificationIconColor(type: string) {
    switch (type) {
      case "asset_assigned":
        return "bg-blue-100 text-blue-800";
      case "asset_returned":
        return "bg-green-100 text-green-800";
      case "maintenance_approved":
      case "booking_confirmed":
      case "transfer_approved":
        return "bg-emerald-100 text-emerald-800";
      case "maintenance_rejected":
      case "booking_cancelled":
      case "transfer_rejected":
        return "bg-red-100 text-red-800";
      case "overdue_return":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 relative">
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
        {/* Notifications Popover */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-slate-400 hover:text-slate-600 relative p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="font-semibold text-sm text-slate-800">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      className={`p-4 flex gap-3 transition-colors hover:bg-slate-50 relative ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${getNotificationIconColor(n.type)}`}>
                        {n.title.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex justify-between items-start gap-1">
                          <span className={`text-sm font-medium truncate ${!n.is_read ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap pt-0.5">
                            {formatTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed break-words">
                          {n.message}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button 
                          onClick={(e) => handleMarkRead(n.id, e)}
                          title="Mark as read"
                          className="absolute right-3 top-4 text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
