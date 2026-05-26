import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Calendar, BookOpen, Play, FileText, CreditCard,
  User, Award, Users, Gift, Wrench, LogOut, Menu, X, Sun, Moon,
  ChevronRight, Bell, Heart, Clock, GraduationCap, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const studentMenu = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Schedule", path: "/dashboard/schedule", icon: Calendar },
  { label: "My Classes", path: "/dashboard/classes", icon: BookOpen },
  { label: "Recordings", path: "/dashboard/recordings", icon: Play },
  { label: "Class History", path: "/dashboard/history", icon: Clock },
  { label: "Wishlist", path: "/dashboard/wishlist", icon: Heart },
  { label: "Notes", path: "/dashboard/notes", icon: FileText },
  { label: "Class Requests", path: "/dashboard/requests", icon: MessageSquare },
  { label: "Payments", path: "/dashboard/payments", icon: CreditCard },
];

const studentMore = [
  { label: "My Profile", path: "/dashboard/profile", icon: User },
  { label: "Certificates", path: "/dashboard/certificates", icon: Award },
  { label: "Referrals", path: "/dashboard/referrals", icon: Gift },
];

interface Props { children: ReactNode }

const DashboardLayout = ({ children }: Props) => {
  const { profile, signOut, isAdmin, isTutor } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark", !isDark);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const NavItem = ({ item }: { item: typeof studentMenu[0] }) => {
    const active = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-gradient-to-r from-primary/20 to-secondary/15 text-foreground ring-1 ring-primary/30 shadow-[0_4px_20px_-6px_hsl(var(--primary)/0.4)]"
            : "text-muted-foreground hover:text-foreground hover:bg-card/60"
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-primary to-secondary" />}
        <item.icon className={`w-4 h-4 transition-colors ${active ? "text-primary" : "group-hover:text-primary"}`} />
        {item.label}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-xl">
      <div className="p-4 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Webtuto.LK" className="h-8 w-auto" />
          <span className="font-display font-semibold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">STUDENT</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Menu</p>
        {studentMenu.map((item) => <NavItem key={item.path} item={item} />)}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-4">More</p>
        {studentMore.map((item) => <NavItem key={item.path} item={item} />)}
        {isTutor && (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-4">Teacher</p>
            <Link
              to="/teacher"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <GraduationCap className="w-4 h-4" /> Teacher Panel
            </Link>
          </>
        )}
        {isAdmin && (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-4">Admin</p>
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Wrench className="w-4 h-4" /> Admin Panel
            </Link>
          </>
        )}
      </div>
      <div className="p-3 border-t border-border/60 space-y-1">
        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex bg-mesh">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border/60 flex-col fixed inset-y-0 left-0 z-30">
        {sidebar}
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 border-r border-border/60 z-50">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 glass-strong border-b border-border/60 px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-card/60">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-foreground">Welcome back, {profile?.full_name || "Student"}</p>
              <p className="text-xs text-muted-foreground">{profile?.admission_number || ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-muted-foreground hover:bg-card/60 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
            </button>
            <Link to="/dashboard/profile">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-2 ring-primary/30 hover:ring-primary/60 transition-all">
                <span className="text-primary-foreground text-sm font-bold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            </Link>
          </div>
        </header>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="p-4 lg:p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;
