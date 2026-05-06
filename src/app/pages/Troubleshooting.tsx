import { useState, useEffect, useMemo, type ComponentType } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  ChevronRight,
  Printer,
  Mouse,
  Keyboard,
  Usb,
  Cable,
  Monitor,
  Projector,
  Volume2,
  Camera,
  CheckCircle2,
  Home,
  Mail,
  Edit,
  HelpCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { SmartSearchBar } from "../components/SmartSearchBar";
import { TroubleshootingGuideModal } from "../components/TroubleshootingGuideModal";
import { ContactSupportModal } from "../components/ContactSupportModal";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { DeviceCategorySkeleton, FetchingBadge } from "../components/skeletons/Skeletons";

type ProblemSeverity = "common" | "moderate" | "rare";
type CategoryFilter = "all" | "input" | "output";

interface Step {
  step: number;
  title: string;
  description: string;
  image: string;
}

interface Problem {
  id: number;
  slug: string;
  title: string;
  severity: ProblemSeverity;
  steps: Step[];
}

interface Device {
  id: number;
  name: string;
  // Stored as a string (not a component) so the data round-trips through
  // localStorage when react-query persists the cache. Resolve to the actual
  // lucide component at render time via resolveIcon().
  iconName: string;
  slug: string;
  color: string;
  problems: Problem[];
  category: "input" | "output";
}

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  Keyboard,
  Mouse,
  Camera,
  Usb,
  Cable,
  Monitor,
  Printer,
  Volume2,
  Projector,
};

const resolveIcon = (name: string): ComponentType<{ className?: string }> =>
  ICON_MAP[name] ?? HelpCircle;

// Tailwind v4 only emits CSS for classes it can statically see. Device color
// classes are loaded as strings from Postgres, so we list them here so the
// scanner keeps them in the build. Mirrors devices.color_class.
// bg-blue-500 bg-purple-500 bg-teal-500 bg-orange-500 bg-cyan-500
// bg-indigo-500 bg-green-500 bg-red-500 bg-pink-500
const TAILWIND_SAFELIST =
  "bg-blue-500 bg-purple-500 bg-teal-500 bg-orange-500 bg-cyan-500 " +
  "bg-indigo-500 bg-green-500 bg-red-500 bg-pink-500";
void TAILWIND_SAFELIST;

const SEVERITY_BADGE: Record<ProblemSeverity, { color: string; label: string; order: number }> = {
  common: { color: "bg-green-100 text-green-700 border-green-200", label: "Common", order: 0 },
  moderate: { color: "bg-orange-100 text-orange-700 border-orange-200", label: "Moderate", order: 1 },
  rare: { color: "bg-red-100 text-red-700 border-red-200", label: "Rare", order: 2 },
};

interface TroubleshootingProps {
  searchQuery?: string;
}

export function Troubleshooting(_props: TroubleshootingProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<CategoryFilter>("all");
  const [selectedDeviceSlug, setSelectedDeviceSlug] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<{
    problem: Problem;
    device: Device;
  } | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === "admin";

  const { data: devices = [], isPending: isLoading, isFetching } = useQuery({
    queryKey: ["troubleshooting-tree"],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const [devs, probs] = await Promise.all([
        supabase
          .from("devices")
          .select("id, slug, name, category, icon_name, color_class, display_order")
          .order("display_order", { ascending: true }),
        supabase
          .from("problems")
          .select("id, device_id, slug, title, severity, steps, display_order")
          .order("display_order", { ascending: true }),
      ]);
      if (devs.error) throw devs.error;
      if (probs.error) throw probs.error;

      const problemsByDevice = new Map<number, Problem[]>();
      for (const p of probs.data ?? []) {
        const list = problemsByDevice.get(p.device_id) ?? [];
        list.push({
          id: p.id,
          slug: p.slug,
          title: p.title,
          severity: p.severity as ProblemSeverity,
          steps: (p.steps as Step[]) ?? [],
        });
        problemsByDevice.set(p.device_id, list);
      }

      return (devs.data ?? []).map((d: any) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        category: d.category as "input" | "output",
        color: d.color_class,
        iconName: d.icon_name,
        problems: problemsByDevice.get(d.id) ?? [],
      })) as Device[];
    },
  });

  const visibleDevices = useMemo(() => {
    if (activeTab === "all") return devices;
    return devices.filter((d) => d.category === activeTab);
  }, [devices, activeTab]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.slug === selectedDeviceSlug) ?? null,
    [devices, selectedDeviceSlug],
  );

  const sortedProblems = useMemo(() => {
    if (!selectedDevice) return [];
    return [...selectedDevice.problems].sort(
      (a, b) => SEVERITY_BADGE[a.severity].order - SEVERITY_BADGE[b.severity].order,
    );
  }, [selectedDevice]);

  // Deep-link support: ?device=mouse selects that device on load.
  useEffect(() => {
    if (devices.length === 0) return;
    const deviceParam = searchParams.get("device");
    if (deviceParam && devices.some((d) => d.slug === deviceParam)) {
      setSelectedDeviceSlug(deviceParam);
    }
  }, [searchParams, devices]);

  const selectDevice = (slug: string) => {
    setSelectedDeviceSlug(slug);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("device", slug);
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSelectedDevice = () => {
    setSelectedDeviceSlug(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("device");
      return next;
    });
  };

  const handleExpandGuide = (problem: Problem, device: Device) => {
    setSelectedProblem({ problem, device });
    setModalOpen(true);
  };

  const getGuideId = (deviceSlug: string, problemSlug: string) =>
    `${deviceSlug}::${problemSlug}`;

  const recordFeedback = async (helpful: boolean, device: Device, problem: Problem) => {
    const guideId = getGuideId(device.slug, problem.slug);
    setFeedbackGiven((prev) => new Set(prev).add(guideId));

    const { error } = await supabase.from("troubleshooting_feedback").insert({
      user_id: user?.id ?? null,
      problem_id: problem.id,
      device_slug: device.slug,
      problem_slug: problem.slug,
      helpful,
    });
    if (error) {
      console.warn("Failed to record feedback:", error.message);
    }
  };

  const handleGuideFeedback = (helpful: boolean) => {
    if (!selectedProblem) return;
    if (helpful) {
      toast.success("Glad we could help!", { description: "We've recorded your feedback" });
      void recordFeedback(true, selectedProblem.device, selectedProblem.problem);
      setModalOpen(false);
    } else {
      toast.info("We're here to help!", { description: "Opening contact support form..." });
      void recordFeedback(false, selectedProblem.device, selectedProblem.problem);
      setModalOpen(false);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setContactModalOpen(true);
      }, 300);
    }
  };

  const renderDeviceCard = (device: Device) => {
    const Icon = resolveIcon(device.iconName);
    const probCount = device.problems.length;
    return (
      <button
        key={device.slug}
        type="button"
        onClick={() => selectDevice(device.slug)}
        className="group text-left bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-4"
      >
        <div className={`w-12 h-12 ${device.color} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{device.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {probCount} {probCount === 1 ? "issue" : "issues"}
            <span className="mx-1.5 text-gray-300">·</span>
            <span
              className={`uppercase tracking-wider text-[10px] font-semibold ${
                device.category === "input" ? "text-blue-600" : "text-amber-600"
              }`}
            >
              {device.category}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </button>
    );
  };

  const renderTab = (key: CategoryFilter, label: string, count: number) => {
    const active = activeTab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveTab(key)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          active
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300"
        }`}
      >
        {label}
        <span
          className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
            active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  const inputCount = devices.filter((d) => d.category === "input").length;
  const outputCount = devices.filter((d) => d.category === "output").length;

  return (
    <div className="min-h-screen py-6 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Compact heading row */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="mb-0">Troubleshooting</h1>
            <p className="text-sm text-muted-foreground">
              {selectedDevice
                ? `Pick a problem to see step-by-step instructions.`
                : `Search a device issue or pick a device below.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FetchingBadge isFetching={isFetching} isPending={isLoading} />
            {isAdmin && (
              <Link to="/admin/troubleshooting">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Manage content
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <SmartSearchBar devices={devices} />
        </div>

        {/* Devices grid OR drill-down */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <DeviceCategorySkeleton />
            <DeviceCategorySkeleton />
            <DeviceCategorySkeleton />
          </div>
        ) : selectedDevice ? (
          <section>
            {/* Drill-down header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelectedDevice}
                  className="border-gray-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  All devices
                </Button>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${selectedDevice.color} rounded-xl flex items-center justify-center shadow-sm`}
                  >
                    {(() => {
                      const Icon = resolveIcon(selectedDevice.iconName);
                      return <Icon className="w-5 h-5 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="mb-0">{selectedDevice.name}</h2>
                    <div className="text-xs text-muted-foreground">
                      {sortedProblems.length} {sortedProblems.length === 1 ? "problem" : "problems"}
                      <span className="mx-1.5 text-gray-300">·</span>
                      <span
                        className={`uppercase tracking-wider text-[10px] font-semibold ${
                          selectedDevice.category === "input" ? "text-blue-600" : "text-amber-600"
                        }`}
                      >
                        {selectedDevice.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Problems list */}
            {sortedProblems.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No problems documented for this device yet.
              </Card>
            ) : (
              <div className="space-y-2">
                {sortedProblems.map((problem) => {
                  const badge = SEVERITY_BADGE[problem.severity];
                  return (
                    <button
                      key={problem.id}
                      type="button"
                      onClick={() => handleExpandGuide(problem, selectedDevice)}
                      className="w-full text-left bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all p-4 flex items-center gap-3"
                    >
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${badge.color} flex-shrink-0`}
                      >
                        {badge.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{problem.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {problem.steps.length} step{problem.steps.length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section>
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {renderTab("all", "All", devices.length)}
              {renderTab("input", "Input", inputCount)}
              {renderTab("output", "Output", outputCount)}
            </div>

            {/* Optional category descriptor (only shows when filter active) */}
            {activeTab !== "all" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                {activeTab === "input" ? (
                  <>
                    <ArrowDownToLine className="w-3.5 h-3.5 text-blue-500" />
                    Devices that send data to the computer
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-500" />
                    Devices that receive data from the computer
                  </>
                )}
              </div>
            )}

            {/* Device grid */}
            {visibleDevices.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No devices in this category yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleDevices.map(renderDeviceCard)}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Still having issues CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <Card className="bg-gradient-to-br from-amber-50 to-blue-50 border border-blue-200 p-6 md:p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="mb-2">Still Having Issues?</h3>
            <p className="text-base text-muted-foreground mb-5">
              If none of the steps fixed your device, send us a message and we'll help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button
                  variant="outline"
                  size="default"
                  className="w-full sm:w-auto border-blue-300 hover:bg-blue-100"
                >
                  <Home className="mr-2 w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
              <Link
                to="/contact"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <Button
                  size="default"
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-md"
                >
                  <Mail className="mr-2 w-4 h-4" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {selectedProblem && (
        <TroubleshootingGuideModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          problem={selectedProblem.problem}
          deviceName={selectedProblem.device.name}
          deviceIcon={resolveIcon(selectedProblem.device.iconName)}
          deviceColor={selectedProblem.device.color}
          onFeedback={handleGuideFeedback}
          hasFeedback={feedbackGiven.has(
            getGuideId(selectedProblem.device.slug, selectedProblem.problem.slug),
          )}
        />
      )}

      <ContactSupportModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        deviceName={selectedProblem?.device.name}
        problemTitle={selectedProblem?.problem.title}
      />
    </div>
  );
}
