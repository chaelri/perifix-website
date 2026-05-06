import { useState, useEffect, useMemo, type ComponentType } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
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
  Shield,
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { SmartSearchBar } from "../components/SmartSearchBar";
import { TroubleshootingGuideModal } from "../components/TroubleshootingGuideModal";
import { ContactSupportModal } from "../components/ContactSupportModal";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase/client";
import { toast } from "sonner";
import logoImage from "figma:asset/ab58eeaa257e876782c9f32bf8bd702e735f6d24.png";

type ProblemSeverity = "common" | "moderate" | "rare";

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
  icon: ComponentType<{ className?: string }>;
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

const resolveIcon = (name: string) => ICON_MAP[name] ?? HelpCircle;

interface TroubleshootingProps {
  searchQuery?: string;
}

export function Troubleshooting(_props: TroubleshootingProps) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [expandedSeverity, setExpandedSeverity] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [highlightedSeverity, setHighlightedSeverity] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<{
    problem: Problem;
    device: Device;
  } | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: deviceRows, error: dErr } = await supabase
        .from("devices")
        .select("id, slug, name, category, icon_name, color_class, display_order")
        .order("display_order", { ascending: true });
      if (dErr) {
        toast.error(dErr.message || "Failed to load devices.");
        setIsLoading(false);
        return;
      }
      const { data: problemRows, error: pErr } = await supabase
        .from("problems")
        .select("id, device_id, slug, title, severity, steps, display_order")
        .order("display_order", { ascending: true });
      if (pErr) {
        toast.error(pErr.message || "Failed to load problems.");
        setIsLoading(false);
        return;
      }

      const problemsByDevice = new Map<number, Problem[]>();
      for (const p of problemRows ?? []) {
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

      const built: Device[] = (deviceRows ?? []).map((d: any) => ({
        id: d.id,
        slug: d.slug,
        name: d.name,
        category: d.category as "input" | "output",
        color: d.color_class,
        icon: resolveIcon(d.icon_name),
        problems: problemsByDevice.get(d.id) ?? [],
      }));

      if (mounted) {
        setDevices(built);
        setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const inputDevices = useMemo(() => devices.filter((d) => d.category === "input"), [devices]);
  const outputDevices = useMemo(() => devices.filter((d) => d.category === "output"), [devices]);

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

  const handleInlineGuideFeedback = (helpful: boolean, device: Device, problem: Problem) => {
    if (helpful) {
      toast.success("Glad we could help!", { description: "We've recorded your feedback" });
      void recordFeedback(true, device, problem);
    } else {
      toast.info("We're here to help!", { description: "Opening contact support form..." });
      void recordFeedback(false, device, problem);
      setSelectedProblem({ problem, device });
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setContactModalOpen(true);
      }, 300);
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

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
    setExpandedDevice(null);
    setExpandedSeverity(null);
  };

  const toggleDevice = (deviceSlug: string) => {
    setExpandedDevice(expandedDevice === deviceSlug ? null : deviceSlug);
    setExpandedSeverity(null);
  };

  const toggleSeverity = (key: string) => {
    setExpandedSeverity(expandedSeverity === key ? null : key);
  };

  useEffect(() => {
    if (devices.length === 0) return;

    const category = searchParams.get("category");
    const device = searchParams.get("device");
    const severity = searchParams.get("severity");

    if (category) {
      setExpandedCategory(category);
      if (device) {
        setExpandedDevice(device);
        if (severity) {
          const severityKey = `${device}-${severity}`;
          setExpandedSeverity(severityKey);
          setHighlightedSeverity(severityKey);
          setTimeout(() => {
            const el = document.getElementById(`severity-${severityKey}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => setHighlightedSeverity(null), 2000);
            }
          }, 300);
        }
      }
    }
  }, [searchParams, devices.length]);

  const getSeverityBadge = (severity: ProblemSeverity) => {
    const badges = {
      common: { color: "bg-green-100 text-green-700 border-green-300", label: "Common" },
      moderate: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "Moderate" },
      rare: { color: "bg-red-100 text-red-700 border-red-300", label: "Rare" },
    };
    return badges[severity];
  };

  const renderDeviceList = (deviceList: Device[]) => {
    return deviceList.map((device) => {
      const Icon = device.icon;
      const isDeviceExpanded = expandedDevice === device.slug;

      return (
        <div key={device.slug} className="border-t border-gray-200 first:border-t-0">
          <button
            onClick={() => toggleDevice(device.slug)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${device.color} rounded-lg flex items-center justify-center`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span>{device.name}</span>
            </div>
            {isDeviceExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {isDeviceExpanded && (
            <div className="bg-gray-50 px-4 pb-4">
              {(["common", "moderate", "rare"] as ProblemSeverity[]).map((severity) => {
                const problemsInSeverity = device.problems.filter((p) => p.severity === severity);
                if (problemsInSeverity.length === 0) return null;

                const severityKey = `${device.slug}-${severity}`;
                const isSeverityExpanded = expandedSeverity === severityKey;
                const badge = getSeverityBadge(severity);

                return (
                  <div key={severity} id={`severity-${severityKey}`} className="mb-3">
                    <button
                      onClick={() => toggleSeverity(severityKey)}
                      className={`w-full flex items-center justify-between p-3 bg-white rounded-lg border transition-all duration-300 ${
                        highlightedSeverity === severityKey
                          ? "border-blue-500 shadow-lg ring-4 ring-blue-100"
                          : "hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-sm text-gray-600">
                          {problemsInSeverity.length}{" "}
                          {problemsInSeverity.length === 1 ? "issue" : "issues"}
                        </span>
                      </div>
                      {isSeverityExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    {isSeverityExpanded && (
                      <div className="mt-2 space-y-2">
                        {problemsInSeverity.map((problem) => {
                          const guideId = getGuideId(device.slug, problem.slug);
                          const hasFeedback = feedbackGiven.has(guideId);

                          return (
                            <div
                              key={problem.id}
                              className="bg-white rounded-lg border-2 border-blue-100 p-4"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <h4 className="text-blue-900">{problem.title}</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExpandGuide(problem, device)}
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50 flex-shrink-0 ml-2"
                                >
                                  <Maximize2 className="w-4 h-4 mr-1" />
                                  Expand
                                </Button>
                              </div>
                              <div className="space-y-4 mb-4">
                                {problem.steps.map((step) => (
                                  <div
                                    key={step.step}
                                    className="flex gap-4 p-3 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100"
                                  >
                                    <div className="flex-shrink-0">
                                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                        <span className="text-white">{step.step}</span>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="mb-1 text-sm">{step.title}</h5>
                                      <p className="text-sm text-muted-foreground">
                                        {step.description}
                                      </p>
                                    </div>
                                    <div className="flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden">
                                      <ImageWithFallback
                                        src={step.image}
                                        alt={step.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t-2 border-blue-100 pt-4 mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                                  Did this guide help you?
                                </p>
                                {!hasFeedback ? (
                                  <div className="flex gap-3 justify-center">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleInlineGuideFeedback(true, device, problem)
                                      }
                                      className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                                    >
                                      <ThumbsUp className="w-4 h-4 mr-2" />
                                      Yes, it helped!
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleInlineGuideFeedback(false, device, problem)
                                      }
                                      className="border-2 border-red-300 text-red-700 hover:bg-red-50 shadow-md hover:shadow-lg transition-all"
                                    >
                                      <ThumbsDown className="w-4 h-4 mr-2" />
                                      No, I need help
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span className="text-sm font-medium">
                                        Thank you for your feedback!
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      {isAdmin && (
        <div className="bg-amber-500 border-b-2 border-amber-600 py-3 px-4 sticky top-16 z-40 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white">
                Admin Mode: You have edit access to all troubleshooting content
              </span>
            </div>
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setEditMode(!editMode);
                toast.info(editMode ? "Edit mode disabled" : "Edit mode enabled");
              }}
              className={
                editMode
                  ? "bg-white text-amber-600 hover:bg-gray-100 border-0"
                  : "border-2 border-white text-white hover:bg-amber-600 hover:border-white bg-transparent"
              }
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? "Exit Edit Mode" : "Enable Edit Mode"}
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <img src={logoImage} alt="PERIFIX Logo" className="w-32 h-32 object-contain" />
          </div>
          <h1 className="mb-4">Device Troubleshooting Guide</h1>
          <p className="text-xl text-muted-foreground">
            Select a device category to view troubleshooting steps
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SmartSearchBar devices={devices} />
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading guides…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <button
                onClick={() => toggleCategory("input")}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <ArrowDownToLine className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-white mb-1">Input Devices</h2>
                    <p className="text-sm text-blue-100">Send data to computer</p>
                  </div>
                </div>
                {expandedCategory === "input" ? (
                  <ChevronDown className="w-6 h-6" />
                ) : (
                  <ChevronRight className="w-6 h-6" />
                )}
              </button>

              {expandedCategory === "input" && (
                <div className="bg-white">{renderDeviceList(inputDevices)}</div>
              )}
            </Card>

            <Card className="overflow-hidden">
              <button
                onClick={() => toggleCategory("output")}
                className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <ArrowUpFromLine className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-white mb-1">Output Devices</h2>
                    <p className="text-sm text-amber-100">Receive data from computer</p>
                  </div>
                </div>
                {expandedCategory === "output" ? (
                  <ChevronDown className="w-6 h-6" />
                ) : (
                  <ChevronRight className="w-6 h-6" />
                )}
              </button>

              {expandedCategory === "output" && (
                <div className="bg-white">{renderDeviceList(outputDevices)}</div>
              )}
            </Card>
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-br from-amber-50 to-blue-50 border-2 border-blue-200 p-8 md:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="mb-4">Still Having Issues?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              If you've tried all the steps and your device still isn't working, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-blue-300 hover:bg-blue-50"
                >
                  <Home className="mr-2 w-5 h-5" />
                  Back to Home
                </Button>
              </Link>
              <Link
                to="/contact"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-md"
                >
                  <Mail className="mr-2 w-5 h-5" />
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
          deviceIcon={selectedProblem.device.icon}
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
