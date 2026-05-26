import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, BookOpen, Play, Users, Calendar, FileText,
  LogOut, Menu, Sun, Moon, CreditCard, Brain
} from "lucide-react";
import logo from "@/assets/logo.png";

const teacherMenu = [
  { label: "Dashboard", path: "/teacher", icon: LayoutDashboard },
  { label: "My Classes", path: "/teacher/classes", icon: BookOpen },
  { label: "Sessions & Zoom", path: "/teacher/sessions", icon: Calendar },
  { label: "My Students", path: "/teacher/students", icon: Users },
  { label: "Recordings", path: "/teacher/recordings", icon: Play },
  { label: "Quiz Center", path: "/teacher/quiz-center", icon: Brain },
  { label: "Earnings", path: "/teacher/earnings", icon: CreditCard },
];

interface Props { children: ReactNode }

const TeacherLayout = ({ children }: Props) => {
  const { signOut, profile } = useAuth();
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

  const NavItem = ({ item }: { item: typeof teacherMenu[0] }) => {
    const active = location.pathname === item.path;
    return (
      <Link to={item.path} onClick={() => setSidebarOpen(false)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-gradient-to-r from-primary/20 to-secondary/15 text-foreground ring-1 ring-primary/30 shadow-[0_4px_20px_-6px_hsl(var(--primary)/0.4)]"
            : "text-muted-foreground hover:text-foreground hover:bg-card/60"
        }`}>
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-primary to-secondary" />}
        <item.icon className={`w-4 h-4 ${active ? "text-primary" : "group-hover:text-primary"}`} /> {item.label}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-xl">
      <div className="p-4 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Webtuto.LK" className="h-8 w-auto" />
          <span className="font-display font-semibold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">TEACHER</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {teacherMenu.map((item) => <NavItem key={item.path} item={item} />)}
      </div>
      <div className="p-3 border-t border-border/60 space-y-1">
        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {isDark ? "Light" : "Dark"} Mode
        </button>
        <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background bg-mesh flex">
      <aside className="hidden lg:flex w-64 border-r border-border/60 flex-col fixed inset-y-0 left-0 z-30">{sidebar}</aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 border-r border-border/60 z-50">{sidebar}</aside>
        </div>
      )}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 glass-strong border-b border-border/60 px-4 lg:px-6 h-16 flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-card/60 mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-sm font-semibold text-foreground">Welcome, <span className="text-gradient">{profile?.full_name || "Teacher"}</span></p>
        </header>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="p-4 lg:p-6 pb-24 lg:pb-6"
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile bottom tab nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border/60 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 gap-1">
          {[
            { label: "Home", path: "/teacher", icon: LayoutDashboard },
            { label: "Classes", path: "/teacher/classes", icon: BookOpen },
            { label: "Sessions", path: "/teacher/sessions", icon: Calendar },
            { label: "Students", path: "/teacher/students", icon: Users },
            { label: "Earnings", path: "/teacher/earnings", icon: CreditCard },
          ].map((t) => {
            const active = location.pathname === t.path;
            return (
              <Link
                key={t.path}
                to={t.path}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="teacher-tab-active-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/20 to-secondary/10 ring-1 ring-primary/30"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <t.icon className="w-5 h-5 relative" />
                <span className="text-[10px] font-semibold relative">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default TeacherLayout;
