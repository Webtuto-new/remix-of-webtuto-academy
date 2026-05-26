import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sun, Moon, Search, ShoppingCart, ArrowUpRight, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Home", path: "/", hint: "Start here" },
  { label: "Curriculum", path: "/curriculum", hint: "Explore syllabi" },
  { label: "Classes", path: "/classes", hint: "Live & on-demand" },
  { label: "Recordings", path: "/recordings", hint: "Watch anytime" },
  { label: "Request a Class", path: "/request-class", hint: "Custom requests" },
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

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || isOpen
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

          {/* Spacer (nav moved to hamburger menu on all sizes) */}
          <div className="flex-1" />

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

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`relative ml-2 h-10 pl-3 pr-4 rounded-full overflow-hidden group transition-all duration-300 border shrink-0 ${
                isOpen
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/60 hover:border-primary/50 bg-muted/30 hover:bg-muted/60"
              }`}
              type="button"
              aria-label="Menu"
              aria-expanded={isOpen}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center gap-2">
                <span className="flex flex-col justify-center items-end gap-[5px] w-5">
                  <span
                    className={`block h-[2px] bg-foreground rounded-full transition-all duration-300 ease-out ${
                      isOpen ? "w-5 translate-y-[7px] rotate-45" : "w-5"
                    }`}
                  />
                  <span
                    className={`block h-[2px] bg-foreground rounded-full transition-all duration-200 ${
                      isOpen ? "w-0 opacity-0" : "w-3 group-hover:w-5"
                    }`}
                  />
                  <span
                    className={`block h-[2px] bg-foreground rounded-full transition-all duration-300 ease-out ${
                      isOpen ? "w-5 -translate-y-[7px] -rotate-45" : "w-4 group-hover:w-5"
                    }`}
                  />
                </span>
                <span className="hidden sm:inline text-xs font-medium tracking-wider uppercase">
                  {isOpen ? "Close" : "Menu"}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Premium full-screen overlay menu */}
    <div
      className={`fixed inset-0 z-40 transition-all duration-500 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
      />
      {/* Floating glow blobs */}
      <div
        className={`absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-3xl transition-all duration-1000 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      />
      <div
        className={`absolute bottom-0 right-0 w-[32rem] h-[32rem] rounded-full bg-accent/20 blur-3xl transition-all duration-1000 delay-100 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      />

      {/* Content */}
      <div className="relative h-full overflow-y-auto pt-24 lg:pt-28 pb-12">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <div
            className={`flex items-center gap-2 text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8 transition-all duration-500 ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Navigate
          </div>

          <ul className="space-y-1 lg:space-y-2 border-t border-border/40">
            {navItems.map((item, i) => {
              const active = location.pathname === item.path;
              return (
                <li
                  key={item.path}
                  className={`border-b border-border/40 transition-all ease-out ${
                    isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{
                    transitionDuration: "700ms",
                    transitionDelay: isOpen ? `${150 + i * 80}ms` : "0ms",
                  }}
                >
                  <Link
                    to={item.path}
                    className="group relative flex items-center justify-between py-5 lg:py-7 px-2 overflow-hidden"
                  >
                    {/* hover sweep */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out bg-gradient-to-r from-primary/10 via-accent/10 to-transparent" />

                    <span className="relative flex items-baseline gap-5 lg:gap-8">
                      <span className="text-xs font-mono text-muted-foreground tabular-nums">
                        0{i + 1}
                      </span>
                      <span
                        className={`font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight transition-all duration-500 ${
                          active
                            ? "bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                            : "text-foreground group-hover:translate-x-3 group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent group-hover:bg-clip-text group-hover:text-transparent"
                        }`}
                      >
                        {item.label}
                      </span>
                    </span>

                    <span className="relative flex items-center gap-4">
                      <span className="hidden md:inline text-sm text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                        {item.hint}
                      </span>
                      <span className="flex items-center justify-center w-11 h-11 rounded-full border border-border/60 group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300 group-hover:rotate-45">
                        <ArrowUpRight className="w-4 h-4 transition-transform" />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* CTAs */}
          <div
            className={`mt-10 flex flex-col sm:flex-row gap-3 transition-all duration-700 ${
              isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: isOpen ? `${150 + navItems.length * 80}ms` : "0ms" }}
          >
            {user ? (
              <>
                <Link to="/dashboard" className="flex-1 sm:flex-none">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 sm:flex-none rounded-full px-8"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex-1 sm:flex-none">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto rounded-full px-8 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-[0_8px_30px_hsl(var(--primary)/0.3)]"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Footer info */}
          <div
            className={`mt-16 pt-8 border-t border-border/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-muted-foreground transition-all duration-700 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: isOpen ? `${250 + navItems.length * 80}ms` : "0ms" }}
          >
            <span className="tracking-widest uppercase">Webtuto.LK — Learn beyond limits</span>
            <a href="mailto:admin@webtuto.lk" className="hover:text-foreground transition-colors">
              admin@webtuto.lk
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Navbar;
