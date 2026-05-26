import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, Search, ChevronRight, ShoppingCart } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Curriculum", path: "/curriculum" },
  { label: "Classes", path: "/classes" },
  { label: "Recordings", path: "/recordings" },
  { label: "Request a Class", path: "/request-class" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-strong shadow-[0_1px_0_hsl(var(--border)/0.5),0_8px_30px_hsl(var(--primary)/0.12)]"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center h-16 lg:h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 lg:w-48">
            <img
              src={logo}
              alt="Webtuto.LK"
              className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Nav — Centered */}
          <div className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center bg-muted/50 rounded-full px-1.5 py-1.5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-5 py-1.5 rounded-full text-sm font-body font-semibold tracking-[0.02em] transition-all duration-300 ${
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 lg:w-48 lg:justify-end">
            <Link
              to="/search"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
            >
              <Search className="w-[18px] h-[18px]" />
            </Link>
            <Link
              to="/checkout"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 relative"
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
              aria-label="Toggle theme"
              type="button"
            >
              {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            <div className="hidden lg:flex items-center gap-2 ml-2">
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="rounded-full text-sm font-semibold tracking-[0.01em]">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="rounded-full text-sm font-semibold tracking-[0.01em]"
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="rounded-full text-sm font-semibold tracking-[0.01em]">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button
                      size="sm"
                      className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-bold tracking-[0.01em] px-5 shadow-sm"
                    >
                      Get Started
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
              type="button"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-background/95 glass border-t border-border/50 animate-in slide-in-from-top-2 duration-300">
          <div className="container mx-auto px-4 py-5 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? "text-primary-foreground bg-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {item.label}
                <ChevronRight className="w-4 h-4 opacity-40" />
              </Link>
            ))}
            <div className="flex gap-2.5 pt-5 border-t border-border/50 mt-4">
              {user ? (
                <>
                  <Link to="/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup" className="flex-1">
                    <Button className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
