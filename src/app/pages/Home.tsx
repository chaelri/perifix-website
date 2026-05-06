import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Search, CheckCircle2, Zap, Eye, Lock, Printer, Mouse, Keyboard, Monitor } from "lucide-react";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import { useAuth } from "../contexts/AuthContext";

export function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-white">
        {/* Background image */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1580982330720-bd5e0fed108b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwZml4aW5nJTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzYzMzY3ODE1fDA&ixlib=rb-4.1.0&q=80&w=1920&utm_source=figma&utm_medium=referral')",
          }}
        />
        {/* Blue tint overlay */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-blue-700/90 via-blue-700/85 to-blue-900/90"
        />
        {/* Diagonal line pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 16px)",
          }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="lg:max-w-[75%]">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full mb-6">
              <BuildOutlinedIcon sx={{ fontSize: 18 }} />
              <span className="text-sm">Simple • Visual • Effective</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 text-white">
              Visual Troubleshooting Guide for Peripherals
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Fix device issues step-by-step with clear visual guides. No technical expertise needed.
            </p>
            {!user ? (
              <Link to="/login-selection">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                  Learn More
                  <Search className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/troubleshooting">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                  Start Troubleshooting
                  <Search className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Curved Divider */}
      <div className="relative h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <svg
          className="absolute bottom-0 w-full h-16"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"
            fill="#f59e0b"
            opacity="0.3"
          />
          <path
            d="M0,20 C300,110 900,110 1200,20 L1200,120 L0,120 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Preview Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1 bg-amber-500/10 text-amber-600 rounded-full mb-4">
              {user ? "Available Guides" : "Preview"}
            </div>
            <h2 className="mb-4">Sample Troubleshooting Guides</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {user 
                ? "Click on any device card below to access our comprehensive troubleshooting guides."
                : "Get a glimpse of our step-by-step visual guides. Full access available after login."
              }
            </p>
          </div>

          {/* Device Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { name: "Printer", icon: Printer, color: "bg-green-500", category: "output", slug: "printer" },
              { name: "Mouse", icon: Mouse, color: "bg-purple-500", category: "input", slug: "mouse" },
              { name: "Keyboard", icon: Keyboard, color: "bg-blue-500", category: "input", slug: "keyboard" },
              { name: "Monitor", icon: Monitor, color: "bg-indigo-500", category: "output", slug: "monitor" },
            ].map((device) => {
              const Icon = device.icon;
              return (
                <div
                  key={device.name}
                  className={`bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 transition-all relative overflow-hidden ${
                    user 
                      ? "border-blue-300 hover:border-blue-400 hover:shadow-lg cursor-pointer" 
                      : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
                  }`}
                  onClick={() => {
                    if (user) {
                      window.location.href = `/troubleshooting?category=${device.category}&device=${device.slug}`;
                    }
                  }}
                >
                  {user ? (
                    <div className="absolute top-4 right-4 bg-green-100 backdrop-blur-sm rounded-lg p-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-gray-900/5 backdrop-blur-sm rounded-lg p-2">
                      <Lock className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  <div className={`w-14 h-14 ${device.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="mb-2">{device.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Common issues and solutions
                  </p>
                  <div className="space-y-2">
                    <div className={`rounded-lg p-2 text-xs ${
                      user ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                          user ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500"
                        }`}>1</div>
                        <span className={user ? "" : "opacity-60"}>Step 1: Check connections...</span>
                      </div>
                    </div>
                    <div className={`rounded-lg p-2 text-xs ${
                      user ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-xs ${
                          user ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500"
                        }`}>2</div>
                        <span className={user ? "" : "opacity-60"}>Step 2: Restart device...</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Call to Action for Login */}
          {!user && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-center text-white">
              <Lock className="w-12 h-12 mx-auto mb-4 text-amber-400" />
              <h3 className="mb-3 text-white">Login Required for Full Access</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Access complete step-by-step guides, visual illustrations, and troubleshooting solutions for all 9 peripheral devices.
              </p>
              <Link to="/login-selection">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white shadow-xl">
                  Login to Continue
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-blue-50 to-amber-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1 bg-blue-600/10 text-blue-600 rounded-full mb-4">
              Why Choose PERIFIX?
            </div>
            <h2 className="mb-4">Troubleshooting Made Simple</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="mb-3">Visual Guides</h3>
              <p className="text-muted-foreground">
                Each step includes clear visual illustrations so you can see exactly what to do.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="mb-3">Easy to Follow</h3>
              <p className="text-muted-foreground">
                Step-by-step instructions designed specifically for non-technical users.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="mb-3">Quick Solutions</h3>
              <p className="text-muted-foreground">
                Find and fix common peripheral issues in minutes, not hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 text-center text-white shadow-xl">
          <h2 className="mb-4 text-white">Ready to Fix Your Device?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Get started with our visual troubleshooting guide and solve your peripheral connectivity issues now.
          </p>
          {!user ? (
            <Link to="/login-selection">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-100 shadow-lg">
                Get Started
                <Search className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Link to="/troubleshooting">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-100 shadow-lg">
                Go to Troubleshooting
                <Search className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}