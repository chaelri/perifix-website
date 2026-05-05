import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, User, Shield, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "./ui/sheet";
import { useAuth } from "../contexts/AuthContext";
import logoImage from "figma:asset/ab58eeaa257e876782c9f32bf8bd702e735f6d24.png";
import { useState } from "react";
import { LoadingScreen } from "./LoadingScreen";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Troubleshooting", path: "/troubleshooting" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "FAQs", path: "/faqs" },
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
                      className={isActive(link.path) ? "bg-amber-500 hover:bg-amber-600 shadow-sm" : "text-amber-600 hover:bg-amber-50 hover:text-black"}
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
                  className="border-red-300 text-red-600 hover:bg-red-50"
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
              <SheetContent>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate to different sections of the website
                </SheetDescription>
                <div className="flex flex-col gap-4 mt-8">
                  {user && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <User className="w-4 h-4" />
                        <span>{user.name}</span>
                        {user.role === "admin" && (
                          <span className="ml-auto px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {navLinks.map((link) => (
                    <Button
                      key={link.path}
                      variant={isActive(link.path) ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActive(link.path) ? "bg-primary" : ""
                      }`}
                      onClick={() => navigate(link.path)}
                    >
                      {link.name}
                    </Button>
                  ))}
                  
                  {/* Admin Links in Mobile Menu */}
                  {user?.role === "admin" && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="text-xs text-gray-500 px-2 mb-1">Admin Tools</div>
                      {adminLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Button
                            key={link.path}
                            variant={isActive(link.path) ? "default" : "ghost"}
                            className={`w-full justify-start ${
                              isActive(link.path) ? "bg-amber-500 hover:bg-amber-600" : "text-amber-600 hover:bg-amber-50"
                            }`}
                            onClick={() => navigate(link.path)}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {link.name}
                          </Button>
                        );
                      })}
                    </>
                  )}
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full justify-start bg-amber-500 hover:bg-amber-600"
                      onClick={() => navigate("/login-selection")}
                    >
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