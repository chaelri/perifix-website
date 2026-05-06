import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  LogOut,
  Shield,
  Users,
  Home as HomeIcon,
  Wrench,
  Info,
  Mail,
  HelpCircle,
  ChevronRight,
  LogIn,
} from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { useAuth } from "../contexts/AuthContext";
import logoImage from "../assets/perifix-logo.png";
import { useState } from "react";
import { LoadingScreen } from "./LoadingScreen";

type IconType = ComponentType<{ className?: string }>;

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navLinks: { name: string; path: string; icon: IconType }[] = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Troubleshooting", path: "/troubleshooting", icon: Wrench },
    { name: "About", path: "/about", icon: Info },
    { name: "Contact", path: "/contact", icon: Mail },
    { name: "FAQs", path: "/faqs", icon: HelpCircle },
  ];

  const adminLinks = [
    { name: "Admin Dashboard", path: "/admin-dashboard", icon: Shield },
    { name: "User Accounts", path: "/user-accounts", icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={logoImage} alt="PERIFIX Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl text-primary">PERIFIX</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant={isActive(link.path) ? "default" : "ghost"}
                className={isActive(link.path) ? "bg-primary shadow-sm" : ""}
                onClick={() => navigate(link.path)}
              >
                {link.name}
              </Button>
            ))}
            
            {/* Admin Links - Only shown for admin users */}
            {user?.role === "admin" && (
              <>
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Button
                      key={link.path}
                      variant={isActive(link.path) ? "default" : "ghost"}
                      className={isActive(link.path) ? "bg-amber-500 hover:bg-amber-600 text-white hover:text-white shadow-sm" : "text-amber-600 hover:bg-amber-100 hover:text-amber-700"}
                      onClick={() => navigate(link.path)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {link.name}
                    </Button>
                  );
                })}
              </>
            )}
            
            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">{user.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-100"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                className="ml-2 bg-amber-500 hover:bg-amber-600"
                onClick={() => navigate("/login-selection")}
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger>
                <div className="p-2 hover:bg-primary/10 rounded-md transition-colors">
                  <Menu className="w-6 h-6" />
                </div>
              </SheetTrigger>
              <SheetContent className="p-0 flex flex-col gap-0 w-[88vw] sm:max-w-sm">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate to different sections of the website
                </SheetDescription>

                <div className="px-5 pt-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={logoImage}
                        alt="PERIFIX Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-blue-700">
                      PERIFIX
                    </span>
                  </div>

                  {user ? (
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-3.5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                          {(user.name || user.email || "?")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                          {user.role === "admin" && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Shield className="w-2 h-2 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {user.name}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {user.email}
                          </div>
                        </div>
                        {user.role === "admin" && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wide">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3.5 text-center text-sm text-slate-500">
                      Sign in to access troubleshooting
                    </div>
                  )}
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4">
                  <div className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Navigate
                  </div>
                  <ul className="space-y-1">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const active = isActive(link.path);
                      return (
                        <li key={link.path}>
                          <button
                            type="button"
                            onClick={() => navigate(link.path)}
                            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                              active
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                active ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                              }`}
                            />
                            <span className="flex-1 text-left">{link.name}</span>
                            <ChevronRight
                              className={`w-4 h-4 ${
                                active ? "text-white/80" : "text-slate-300 group-hover:text-blue-400"
                              }`}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {user?.role === "admin" && (
                    <>
                      <div className="px-2 mt-6 mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                        Admin Tools
                      </div>
                      <ul className="space-y-1">
                        {adminLinks.map((link) => {
                          const Icon = link.icon;
                          const active = isActive(link.path);
                          return (
                            <li key={link.path}>
                              <button
                                type="button"
                                onClick={() => navigate(link.path)}
                                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                  active
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-amber-700 hover:bg-amber-50"
                                }`}
                              >
                                <Icon
                                  className={`w-4 h-4 ${
                                    active ? "text-white" : "text-amber-500"
                                  }`}
                                />
                                <span className="flex-1 text-left">{link.name}</span>
                                <ChevronRight
                                  className={`w-4 h-4 ${
                                    active ? "text-white/80" : "text-amber-300"
                                  }`}
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </nav>

                <div className="px-3 py-3 border-t border-slate-100 bg-slate-50/60">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  ) : (
                    <Button
                      className="w-full justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                      onClick={() => navigate("/login-selection")}
                    >
                      <LogIn className="w-4 h-4" />
                      Login
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      {isLoggingOut && <LoadingScreen />}
    </nav>
  );
}