import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  CheckCircle2,
  Zap,
  Eye,
  Lock,
  Printer,
  Mouse,
  Keyboard,
  Monitor,
  Headphones,
  Webcam,
  ChevronRight,
} from "lucide-react";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import { useAuth } from "../contexts/AuthContext";

const HERO_PHRASES = [
  "mouse not working",
  "printer offline",
  "no display signal",
  "keyboard not detected",
  "webcam stuck on black",
];

type HeroSeverity = "Common" | "Moderate" | "Rare";

interface HeroProblem {
  title: string;
  steps: string;
  severity: HeroSeverity;
}

interface HeroDevice {
  slug: string;
  name: string;
  category: "Input" | "Output";
  iconBg: string;
  Icon: ComponentType<{ className?: string }>;
  problems: HeroProblem[];
}

const HERO_DEVICES: HeroDevice[] = [
  {
    slug: "monitor",
    name: "Monitor",
    category: "Output",
    iconBg: "bg-indigo-500",
    Icon: Monitor,
    problems: [
      { title: "No Display Signal", steps: "2 steps", severity: "Common" },
      { title: "Blurry Display", steps: "1 step", severity: "Moderate" },
      { title: "Screen Flickering", steps: "1 step", severity: "Rare" },
    ],
  },
  {
    slug: "mouse",
    name: "Mouse",
    category: "Input",
    iconBg: "bg-purple-500",
    Icon: Mouse,
    problems: [
      { title: "Cursor Not Moving", steps: "3 steps", severity: "Common" },
      { title: "Erratic Movement", steps: "2 steps", severity: "Moderate" },
      { title: "Buttons Not Clicking", steps: "1 step", severity: "Rare" },
    ],
  },
  {
    slug: "keyboard",
    name: "Keyboard",
    category: "Input",
    iconBg: "bg-blue-500",
    Icon: Keyboard,
    problems: [
      { title: "Keys Not Registering", steps: "2 steps", severity: "Common" },
      { title: "Wrong Characters", steps: "1 step", severity: "Moderate" },
      { title: "Keyboard Disconnects", steps: "2 steps", severity: "Rare" },
    ],
  },
  {
    slug: "printer",
    name: "Printer",
    category: "Output",
    iconBg: "bg-green-500",
    Icon: Printer,
    problems: [
      { title: "Printer Offline", steps: "3 steps", severity: "Common" },
      { title: "Paper Jam", steps: "2 steps", severity: "Moderate" },
      { title: "Faded Print", steps: "1 step", severity: "Rare" },
    ],
  },
];

const SEVERITY_STYLE: Record<HeroSeverity, string> = {
  Common: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Rare: "bg-rose-50 text-rose-700 border-rose-200",
};

function useTypewriter(
  phrases: string[],
  typeSpeed = 70,
  deleteSpeed = 35,
  holdMs = 1400,
) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[idx];
    if (!deleting && text === phrase) {
      const t = setTimeout(() => setDeleting(true), holdMs);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIdx((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(
      () => {
        setText(
          deleting
            ? phrase.slice(0, text.length - 1)
            : phrase.slice(0, text.length + 1),
        );
      },
      deleting ? deleteSpeed : typeSpeed,
    );
    return () => clearTimeout(t);
  }, [text, idx, deleting, phrases, typeSpeed, deleteSpeed, holdMs]);

  return text;
}

export function Home() {
  const { user } = useAuth();
  const typed = useTypewriter(HERO_PHRASES);
  const [heroDeviceIdx, setHeroDeviceIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroDeviceIdx((i) => (i + 1) % HERO_DEVICES.length);
    }, 6500);
    return () => clearInterval(t);
  }, []);

  const heroDevice = HERO_DEVICES[heroDeviceIdx];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full mb-6">
                <BuildOutlinedIcon sx={{ fontSize: 18 }} />
                <span className="text-sm">Simple • Visual • Effective</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 text-white">
                Visual Troubleshooting Guide for Peripherals
              </h1>
              <p className="text-xl md:text-2xl mb-6 text-blue-100">
                Fix device issues step-by-step with clear visual guides. No technical expertise needed.
              </p>

              {/* Animated search teaser */}
              <div className="mb-8 max-w-md flex items-center gap-3 bg-white/95 rounded-full shadow-2xl shadow-blue-900/30 px-5 py-3.5 ring-1 ring-white/40">
                <Search className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-gray-800 truncate">
                  {typed}
                  <span className="inline-block w-0.5 h-4 align-middle ml-0.5 bg-blue-600 animate-pulse" />
                </span>
              </div>

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

            {/* Right: troubleshooting card mock + floating peripheral icons */}
            <div className="relative h-[420px] hidden lg:block">
              {/* Floating peripheral icons */}
              <Mouse
                aria-hidden
                className="absolute top-2 left-0 w-12 h-12 text-white/20 -rotate-12"
              />
              <Keyboard
                aria-hidden
                className="absolute top-6 right-2 w-14 h-14 text-white/15 rotate-6"
              />
              <Printer
                aria-hidden
                className="absolute bottom-8 left-2 w-12 h-12 text-white/20 rotate-12"
              />
              <Headphones
                aria-hidden
                className="absolute bottom-2 right-6 w-12 h-12 text-white/15 -rotate-6"
              />
              <Webcam
                aria-hidden
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-white/5"
              />

              {/* Stacked card deck — next card peeks behind, slides up to take
                  the front, while the old front fades out and a new back fades in. */}
              <div className="absolute inset-0 flex items-center justify-center [perspective:1200px]">
                <AnimatePresence initial={false}>
                  {[
                    { dev: heroDevice, role: "front" as const },
                    {
                      dev: HERO_DEVICES[(heroDeviceIdx + 1) % HERO_DEVICES.length],
                      role: "back" as const,
                    },
                  ].map(({ dev, role }) => (
                    <motion.div
                      key={dev.slug}
                      initial={{ opacity: 0, y: 70, scale: 0.85, rotate: -10, zIndex: 1 }}
                      animate={
                        role === "front"
                          ? { opacity: 1, y: 0, scale: 1, rotate: -3, zIndex: 2 }
                          : { opacity: 0.55, y: 28, scale: 0.93, rotate: -7, zIndex: 1 }
                      }
                      exit={{ opacity: 0, y: -32, scale: 1.04, rotate: 1, zIndex: 3 }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute w-[92%] max-w-md bg-white text-gray-900 rounded-2xl shadow-2xl shadow-blue-900/40 ring-1 ring-white/10 overflow-hidden"
                    >
                      {/* Card header */}
                      <div className="flex items-center gap-3 p-5 border-b border-gray-100">
                        <div
                          className={`w-11 h-11 ${dev.iconBg} rounded-xl flex items-center justify-center shadow-sm`}
                        >
                          <dev.Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium leading-tight">{dev.name}</div>
                          <div className="text-xs text-gray-500">
                            {dev.problems.length} problems
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span className="uppercase tracking-wider text-[10px] font-semibold text-amber-600">
                              {dev.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Problem rows */}
                      <ul className="divide-y divide-gray-100">
                        {dev.problems.map((p) => (
                          <li key={p.title} className="p-4 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${SEVERITY_STYLE[p.severity]}`}
                              >
                                {p.severity}
                              </span>
                              <div className="font-medium mt-1.5">{p.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{p.steps}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
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