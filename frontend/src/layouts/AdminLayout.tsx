import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  DollarSign,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Menu,
  ChevronRight,
  Shield,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  Database,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { logoutRequest } from "@/api/authApi";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, type Notification } from "@/api/notificationApi";

// Sidebar configuration for admin
const sidebarConfig = [
  {
    section: "Overview",
    icon: LayoutDashboard,
    items: [
      {
        path: "/admin",
        name: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        path: "/admin/analytics",
        name: "Analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    section: "User Management",
    icon: Users,
    items: [
      {
        path: "/admin/users",
        name: "All Users",
        icon: Users,
      },
      {
        path: "/admin/landlords",
        name: "Landlords",
        icon: UserCheck,
      },
      {
        path: "/admin/tenants",
        name: "Tenants",
        icon: Users,
      },
      {
        path: "/admin/verifications",
        name: "Verifications",
        icon: Shield,
      },
    ],
  },
  {
    section: "Properties",
    icon: Building2,
    items: [
      {
        path: "/admin/properties",
        name: "All Properties",
        icon: Building2,
      },
      {
        path: "/admin/property-requests",
        name: "Property Requests",
        icon: FileText,
      },
    ],
  },
  {
    section: "Financial",
    icon: DollarSign,
    items: [
      {
        path: "/admin/payments",
        name: "All Payments",
        icon: DollarSign,
      },
      {
        path: "/admin/transactions",
        name: "Transactions",
        icon: TrendingUp,
      },
    ],
  },
  {
    section: "System",
    icon: Database,
    items: [
      {
        path: "/admin/reports",
        name: "Reports",
        icon: BarChart3,
      },
      {
        path: "/admin/system-logs",
        name: "System Logs",
        icon: Activity,
      },
    ],
  },
];

// Breadcrumb configuration
const breadcrumbConfig: Record<string, { name: string; parent?: string }> = {
  "/admin": { name: "Dashboard" },
  "/admin/analytics": { name: "Analytics" },
  "/admin/users": { name: "All Users" },
  "/admin/landlords": { name: "Landlords" },
  "/admin/tenants": { name: "Tenants" },
  "/admin/verifications": { name: "Verifications" },
  "/admin/properties": { name: "All Properties" },
  "/admin/property-requests": { name: "Property Requests" },
  "/admin/payments": { name: "All Payments" },
  "/admin/transactions": { name: "Transactions" },
  "/admin/reports": { name: "Reports" },
  "/admin/system-logs": { name: "System Logs" },
  "/admin/settings": { name: "Settings" },
};

// Components
const Sidebar = ({
  isMobile,
  onClose,
}: {
  isMobile?: boolean;
  onClose?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutRequest(); // ✅ call backend
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      // ✅ clear Zustand store
      const { clearUser } = useAuthStore.getState();
      clearUser();

      toast.success("Logged out successfully");
      navigate("/auth/login", { replace: true });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200",
        isMobile ? "w-64" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-purple-400 to-blue-400 p-2 rounded-lg shadow-sm">
            <Shield className="text-white h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              RentEase
            </h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {sidebarConfig.map((section, index) => (
          <div key={index} className="space-y-2">
            {/* Section Header */}
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50/50 rounded-md">
              <section.icon className="h-3 w-3 text-gray-400" />
              <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                {section.section}
              </h3>
            </div>

            {/* Section Items */}
            <div className="space-y-0.5 pl-1">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200",
                    location.pathname === item.path
                      ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      location.pathname === item.path
                        ? "text-purple-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className="text-xs font-medium">{item.name}</span>
                  {location.pathname === item.path && (
                    <div className="ml-auto w-1 h-1 bg-purple-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <Link
          to="/admin/account"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Users className="h-4 w-4" />
          <span>Account Profile</span>
        </Link>
        <Link
          to="/admin/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <SettingsIcon className="h-4 w-4" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const Header = ({ onMobileMenuClick }: { onMobileMenuClick: () => void }) => {
  const location = useLocation();
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { name: string; path?: string }[]
  >([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // ✅ pull user from auth store
  const user = useAuthStore((s) => s.user);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (notifsOpen && !target.closest(".notification-dropdown")) {
        setNotifsOpen(false);
      }
    };

    if (notifsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifsOpen]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    setNotificationsLoading(true);
    try {
      const response = await getNotifications({ limit: 10 });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Only show error toast for actual API failures, not for empty results
      if (error.response?.status >= 500) {
        toast.error("Failed to load notifications");
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Load notifications when component mounts or user changes
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (notifsOpen) {
      fetchNotifications();
    }
  }, [notifsOpen]);

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === "UNREAD") {
      try {
        await markNotificationAsRead(notification.id);
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, status: "READ" as const, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    setNotifsOpen(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: "READ" as const, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  // Breadcrumb logic
  useEffect(() => {
    const generateBreadcrumbs = () => {
      const currentPath = location.pathname;
      const crumbs: { name: string; path?: string }[] = [];
      const paramCache = new Map<string, string>();

      const resolvePath = (pattern: string) => {
        let resolved = pattern;
        for (const [key, value] of paramCache.entries()) {
          resolved = resolved.replace(`:${key}`, value);
        }
        return resolved;
      };

      const findMatch = (path: string) => {
        for (const pattern of Object.keys(breadcrumbConfig)) {
          const paramNames: string[] = [];
          const regexPattern = pattern.replace(/:\w+/g, (param) => {
            paramNames.push(param.substring(1));
            return "([^/]+)";
          });

          const regex = new RegExp(`^${regexPattern}$`);
          const match = path.match(regex);

          if (match) {
            paramNames.forEach((key, idx) => {
              paramCache.set(key, match[idx + 1]);
            });
            return pattern;
          }
        }
        return null;
      };

      const buildCrumbs = (path: string) => {
        const pattern = findMatch(path);
        if (!pattern) return;

        const config = breadcrumbConfig[pattern];
        const resolvedPath = resolvePath(pattern);

        crumbs.push({
          name: config.name,
          path: resolvedPath,
        });

        if (config.parent) {
          buildCrumbs(resolvePath(config.parent));
        }
      };

      buildCrumbs(currentPath);
      const reversed = crumbs.reverse();
      if (reversed.length > 0) {
        reversed[reversed.length - 1].path = undefined;
      }
      setBreadcrumbs(reversed);
    };

    generateBreadcrumbs();
  }, [location.pathname]);

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="flex items-center text-xs sm:text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="mx-1 sm:mx-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                )}
                {crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="text-gray-600 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600 hover:bg-clip-text hover:text-transparent transition-all duration-200 font-medium hover:underline truncate max-w-[80px] sm:max-w-[120px]"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent truncate max-w-[100px] sm:max-w-[140px]">
                    {crumb.name}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Notifications */}
          <div className="relative notification-dropdown">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifsOpen(!notifsOpen)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {notifsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                >
                  <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        System Alerts
                      </h3>
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-xs sm:text-sm text-purple-600 hover:underline"
                        disabled={unreadCount === 0}
                      >
                        Mark all as read
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to={notification.link}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div
                            className={cn(
                              "p-3 sm:p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0",
                              notification.status === "UNREAD" && "bg-purple-50"
                            )}
                          >
                            <div className="flex gap-3">
                              {notification.status === "UNREAD" && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "font-medium text-sm",
                                    notification.status === "UNREAD"
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  )}
                                >
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="p-3 sm:p-4 text-center border-t border-gray-100">
                    <Link
                      to="/admin/alerts"
                      className="text-xs sm:text-sm text-purple-600 hover:underline"
                      onClick={() => setNotifsOpen(false)}
                    >
                      View all alerts
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
              <AvatarImage
                src={user?.avatarUrl ?? undefined}
                alt={user?.firstName ?? "User"}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs sm:text-sm">
                {user?.firstName?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName ?? "Unnamed"}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50/30 via-white to-blue-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 h-screen lg:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Sidebar isMobile onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Header onMobileMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-purple-50/20 to-blue-50/20">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;