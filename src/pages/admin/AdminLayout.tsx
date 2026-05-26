import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, Play, CreditCard,
  FileText, BarChart3, Tag, Bell, Settings, LogOut, Menu, Sun, Moon, Megaphone, Award, DollarSign, Package, Building2, Shield, MessageSquare, Brain, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import HelpTip from "@/components/admin/HelpTip";
import { getAdminTip, getAdminTitle } from "@/lib/adminTips";

const adminMenu: { label: string; path: string; icon: any; tip?: string }[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, tip: "Overview & KPIs" },
  { label: "Classes", path: "/admin/classes", icon: BookOpen, tip: "Create / edit classes" },
  { label: "Sessions & Zoom", path: "/admin/sessions", icon: Play, tip: "Zoom links per session" },
  { label: "Students", path: "/admin/students", icon: Users, tip: "Search & enroll students" },
  { label: "Teachers", path: "/admin/teachers", icon: GraduationCap, tip: "Manage tutor profiles" },
  { label: "Tutor Applications", path: "/admin/applications", icon: FileText, tip: "Approve new tutors" },
  { label: "Class Requests", path: "/admin/class-requests", icon: MessageSquare, tip: "Student class requests" },
  { label: "WhatsApp Messages", path: "/admin/whatsapp", icon: MessageSquare, tip: "Broadcast WhatsApp" },
  { label: "WhatsApp Automation", path: "/admin/whatsapp-automation", icon: Bell, tip: "Auto reminders" },
  { label: "Recordings", path: "/admin/recordings", icon: Play, tip: "Upload lesson videos" },
  { label: "Quizzes", path: "/admin/quizzes", icon: Brain, tip: "Quizzes & live games" },
  { label: "Curriculum", path: "/admin/curriculum", icon: BookOpen, tip: "Curriculum → Grade → Subject" },
  { label: "Bundles", path: "/admin/bundles", icon: Package, tip: "Group classes into packages" },
  { label: "Payments", path: "/admin/payments", icon: CreditCard, tip: "Approve bank transfers" },
  { label: "Bank Details", path: "/admin/bank-details", icon: Building2, tip: "Checkout bank info" },
  { label: "Teacher Payouts", path: "/admin/payouts", icon: DollarSign, tip: "Settle tutor earnings" },
  { label: "Certificates", path: "/admin/certificates", icon: Award, tip: "Issue PDF certificates" },
  { label: "Coupons", path: "/admin/coupons", icon: Tag, tip: "Discount codes" },
  { label: "Announcements", path: "/admin/announcements", icon: Megaphone, tip: "Site-wide banners" },
  { label: "Testimonials", path: "/admin/testimonials", icon: Quote, tip: "Homepage student quotes" },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3, tip: "Revenue & engagement" },
  { label: "Admin Management", path: "/admin/admins", icon: Shield, tip: "Grant admin roles" },
];

interface Props { children: ReactNode }

const AdminLayout = ({ children }: Props) => {
  const { signOut } = useAuth();
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

  const NavItem = ({ item }: { item: typeof adminMenu[0] }) => {
    const active = location.pathname === item.path;
    return (
      <Link to={item.path} onClick={() => setSidebarOpen(false)}
        title={item.tip}
        className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          active
            ? "bg-gradient-to-r from-destructive/20 to-primary/10 text-foreground ring-1 ring-destructive/30 shadow-[0_4px_20px_-6px_hsl(var(--destructive)/0.4)]"
            : "text-muted-foreground hover:text-foreground hover:bg-card/60"
        }`}>
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-destructive to-primary" />}
        <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-destructive" : "group-hover:text-destructive"}`} />
        <span className="flex-1 truncate">{item.label}</span>
      </Link>
    );
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-xl">
      <div className="p-4 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Webtuto.LK" className="h-8 w-auto" />
          <span className="font-display font-semibold text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded">ADMIN</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {adminMenu.map((item) => <NavItem key={item.path} item={item} />)}
        <Link to="/dashboard" onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/60 mt-4">
          <Users className="w-4 h-4" /> Student View
        </Link>
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
        <header className="sticky top-0 z-20 glass-strong border-b border-border/60 px-3 sm:px-4 lg:px-6 h-16 flex items-center gap-2">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-card/60 shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Shield className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm font-semibold text-foreground truncate">{getAdminTitle(location.pathname)}</p>
            {getAdminTip(location.pathname) && (
              <HelpTip title={getAdminTip(location.pathname)!.title}>
                {getAdminTip(location.pathname)!.body}
              </HelpTip>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 active:scale-95 transition shrink-0"
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
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

export default AdminLayout;
