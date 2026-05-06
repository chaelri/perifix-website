import { useState, useMemo, useEffect } from "react";
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
  Trash2,
  Plus,
  Shield,
  Maximize2,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { SmartSearchBar } from "../components/SmartSearchBar";
import { TroubleshootingGuideModal } from "../components/TroubleshootingGuideModal";
import { ContactSupportModal } from "../components/ContactSupportModal";
import { useAuth } from "../contexts/AuthContext";
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
  title: string;
  severity: ProblemSeverity;
  steps: Step[];
}

interface Device {
  name: string;
  icon: any;
  slug: string;
  color: string;
  problems: Problem[];
  category?: "input" | "output";
}

interface TroubleshootingProps {
  searchQuery?: string;
}

export function Troubleshooting({ searchQuery = "" }: TroubleshootingProps) {
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

  const isAdmin = user?.role === "admin";

  const handleExpandGuide = (problem: Problem, device: Device) => {
    setSelectedProblem({ problem, device });
    setModalOpen(true);
  };

  const getGuideId = (deviceName: string, problemTitle: string) => {
    return `${deviceName}-${problemTitle}`;
  };

  const handleInlineGuideFeedback = (helpful: boolean, device: Device, problem: Problem) => {
    const guideId = getGuideId(device.name, problem.title);

    if (helpful) {
      toast.success("Glad we could help!", {
        description: "We've recorded your feedback"
      });
      // Store feedback in localStorage
      const feedback = JSON.parse(localStorage.getItem("troubleshooting_feedback") || "[]");
      feedback.push({
        device: device.name,
        problem: problem.title,
        helpful: true,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("troubleshooting_feedback", JSON.stringify(feedback));

      // Mark this specific guide as having feedback given
      setFeedbackGiven(prev => new Set(prev).add(guideId));
    } else {
      toast.info("We're here to help!", {
        description: "Opening contact support form..."
      });
      setSelectedProblem({ problem, device });
      // Trigger contact support modal
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setContactModalOpen(true);
      }, 300);
    }
  };

  const handleGuideFeedback = (helpful: boolean) => {
    if (!selectedProblem) return;

    const guideId = getGuideId(selectedProblem.device.name, selectedProblem.problem.title);

    if (helpful) {
      toast.success("Glad we could help!", {
        description: "We've recorded your feedback"
      });
      // Store feedback in localStorage
      const feedback = JSON.parse(localStorage.getItem("troubleshooting_feedback") || "[]");
      feedback.push({
        device: selectedProblem.device.name,
        problem: selectedProblem.problem.title,
        helpful: true,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("troubleshooting_feedback", JSON.stringify(feedback));

      // Mark this specific guide as having feedback given
      setFeedbackGiven(prev => new Set(prev).add(guideId));
      setModalOpen(false);
    } else {
      toast.info("We're here to help!", {
        description: "Opening contact support form..."
      });
      setModalOpen(false);
      // Trigger contact support modal
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setContactModalOpen(true);
      }, 300);
    }
  };

  const handleEditContent = (type: string, name: string) => {
    toast.info(`Editing ${type}: ${name}`, {
      description: "This would open an editor dialog in a full implementation"
    });
  };

  const handleDeleteContent = (type: string, name: string) => {
    toast.success(`Deleted ${type}: ${name}`, {
      description: "Content has been removed"
    });
  };

  const handleAddContent = (type: string) => {
    toast.info(`Adding new ${type}`, {
      description: "This would open a creation form in a full implementation"
    });
  };

  const inputDevices: Device[] = [
    {
      name: "Keyboard",
      icon: Keyboard,
      slug: "keyboard",
      color: "bg-blue-500",
      problems: [
        {
          title: "Keyboard Not Detected",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Check USB Connection",
              description: "Ensure the keyboard cable is firmly connected to the USB port",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Try Different USB Port",
              description: "Plug the keyboard into another USB port on your computer",
              image: "https://images.unsplash.com/photo-1535551951406-a19828b0a76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXJ0JTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY0MjMyNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 3,
              title: "Restart Computer",
              description: "Restart your computer to refresh the USB connections",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Some Keys Not Working",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Clean the Keyboard",
              description: "Remove dust and debris from under the affected keys",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Update Keyboard Driver",
              description: "Install the latest keyboard driver from Device Manager",
              image: "https://images.unsplash.com/photo-1634743556192-d19f0c69ff3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGRhdGUlMjBkcml2ZXIlMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Keyboard Lights Not Working",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Check Power Settings",
              description: "Verify keyboard power settings in BIOS/UEFI",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "input"
    },
    {
      name: "Mouse",
      icon: Mouse,
      slug: "mouse",
      color: "bg-purple-500",
      problems: [
        {
          title: "Mouse Not Responding",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Check Connection",
              description: "Ensure mouse is properly connected to USB port",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Replace Batteries (Wireless)",
              description: "For wireless mice, replace with fresh batteries",
              image: "https://images.unsplash.com/photo-1535551951406-a19828b0a76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXJ0JTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY0MjMyNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Cursor Moving Erratically",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Clean Mouse Sensor",
              description: "Clean the optical sensor on the bottom of the mouse",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Use Mouse Pad",
              description: "Place mouse on a proper mouse pad surface",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Mouse Buttons Not Clicking",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Test Different Application",
              description: "Check if the issue occurs in multiple programs",
              image: "https://images.unsplash.com/photo-1634743556192-d19f0c69ff3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGRhdGUlMjBkcml2ZXIlMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "input"
    },
    {
      name: "Webcam",
      icon: Camera,
      slug: "webcam",
      color: "bg-teal-500",
      problems: [
        {
          title: "Webcam Not Detected",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Check USB Connection",
              description: "Ensure webcam is securely plugged into USB port",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Check App Permissions",
              description: "Allow camera access in system privacy settings",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Poor Video Quality",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Clean Camera Lens",
              description: "Wipe the webcam lens with a soft, clean cloth",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Adjust Lighting",
              description: "Improve lighting conditions in your room",
              image: "https://images.unsplash.com/photo-1535551951406-a19828b0a76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXJ0JTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY0MjMyNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Webcam Freezing",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Close Other Applications",
              description: "Close programs that might be using the webcam",
              image: "https://images.unsplash.com/photo-1634743556192-d19f0c69ff3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGRhdGUlMjBkcml2ZXIlMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "input"
    },
    {
      name: "USB Drive",
      icon: Usb,
      slug: "usb-drive",
      color: "bg-orange-500",
      problems: [
        {
          title: "USB Drive Not Recognized",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Try Different USB Port",
              description: "Plug the USB drive into another USB port",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Check Disk Management",
              description: "Open Disk Management to see if drive appears",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Cannot Access Files",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Check File System",
              description: "Verify USB drive is formatted correctly",
              image: "https://images.unsplash.com/photo-1634743556192-d19f0c69ff3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGRhdGUlMjBkcml2ZXIlMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "USB Drive Corrupted",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Run Error Checking",
              description: "Use Windows Error Checking tool to scan drive",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "input"
    },
    {
      name: "LAN Cable",
      icon: Cable,
      slug: "lan-cable",
      color: "bg-cyan-500",
      problems: [
        {
          title: "No Internet Connection",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Check Cable Connection",
              description: "Ensure LAN cable is firmly plugged in at both ends",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Restart Router",
              description: "Power cycle your router and wait 30 seconds",
              image: "https://images.unsplash.com/photo-1535551951406-a19828b0a76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXJ0JTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY0MjMyNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Slow Connection Speed",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Check Cable Quality",
              description: "Verify you're using Cat5e or higher quality cable",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Intermittent Connection",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Replace Cable",
              description: "Try using a different LAN cable",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "input"
    }
  ];

  const outputDevices: Device[] = [
    {
      name: "Monitor",
      icon: Monitor,
      slug: "monitor",
      color: "bg-indigo-500",
      problems: [
        {
          title: "No Display Signal",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Check Video Cable",
              description: "Ensure HDMI/DisplayPort cable is connected properly",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Check Monitor Power",
              description: "Verify monitor is turned on and power cable connected",
              image: "https://images.unsplash.com/photo-1535551951406-a19828b0a76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXJ0JTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY0MjMyNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Blurry Display",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Adjust Resolution",
              description: "Set display resolution to native/recommended setting",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Screen Flickering",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Update Graphics Driver",
              description: "Install latest graphics card driver",
              image: "https://images.unsplash.com/photo-1634743556192-d19f0c69ff3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGRhdGUlMjBkcml2ZXIlMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "output"
    },
    {
      name: "Printer",
      icon: Printer,
      slug: "printer",
      color: "bg-green-500",
      problems: [
        {
          title: "Printer Not Responding",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Check Printer Connection",
              description: "Verify USB cable or network connection is active",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Restart Print Spooler",
              description: "Restart the Print Spooler service in Windows",
              image: "https://images.unsplash.com/photo-1535551951406-a19828b0a76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXJ0JTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY0MjMyNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Print Quality Issues",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Clean Print Heads",
              description: "Run printer's built-in cleaning utility",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Check Ink Levels",
              description: "Replace empty or low ink cartridges",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Paper Jam",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Remove Jammed Paper",
              description: "Carefully remove paper from printer following manual",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "output"
    },
    {
      name: "Speakers",
      icon: Volume2,
      slug: "speakers",
      color: "bg-red-500",
      problems: [
        {
          title: "No Sound Output",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Check Volume Settings",
              description: "Verify system volume is not muted and turned up",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Check Audio Jack",
              description: "Ensure speakers are plugged into correct audio port",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Distorted Audio",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Check Audio Settings",
              description: "Adjust audio enhancements and equalizer settings",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "One Speaker Not Working",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Check Balance Settings",
              description: "Verify left/right balance is centered",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "output"
    },
    {
      name: "Projector",
      icon: Projector,
      slug: "projector",
      color: "bg-pink-500",
      problems: [
        {
          title: "No Image Displayed",
          severity: "common",
          steps: [
            {
              step: 1,
              title: "Check Video Cable",
              description: "Verify HDMI/VGA cable is connected at both ends",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            },
            {
              step: 2,
              title: "Select Input Source",
              description: "Use projector menu to select correct input source",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Blurry Projection",
          severity: "moderate",
          steps: [
            {
              step: 1,
              title: "Adjust Focus",
              description: "Use projector's focus ring to sharpen image",
              image: "https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        },
        {
          title: "Overheating Shutdown",
          severity: "rare",
          steps: [
            {
              step: 1,
              title: "Clean Air Filters",
              description: "Remove and clean projector's air intake filters",
              image: "https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            }
          ]
        }
      ],
      category: "output"
    }
  ];

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

  // Load feedback state from localStorage on mount
  useEffect(() => {
    const feedback = JSON.parse(localStorage.getItem("troubleshooting_feedback") || "[]");
    const givenFeedback = new Set<string>();
    feedback.forEach((f: any) => {
      const guideId = getGuideId(f.device, f.problem);
      givenFeedback.add(guideId);
    });
    setFeedbackGiven(givenFeedback);
  }, []);

  // Handle URL parameters to auto-expand category and device
  useEffect(() => {
    const category = searchParams.get("category");
    const device = searchParams.get("device");
    const severity = searchParams.get("severity");

    if (category) {
      setExpandedCategory(category);

      if (device) {
        setExpandedDevice(device);

        if (severity) {
          // Construct the severity key in the format: deviceSlug-severity
          const severityKey = `${device}-${severity}`;
          setExpandedSeverity(severityKey);
          setHighlightedSeverity(severityKey);

          // Auto-scroll to the severity section after a short delay to allow accordion to expand
          setTimeout(() => {
            const element = document.getElementById(`severity-${severityKey}`);
            if (element) {
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });

              // Remove highlight after animation
              setTimeout(() => {
                setHighlightedSeverity(null);
              }, 2000);
            }
          }, 300);
        }
      }
    }
  }, [searchParams]);

  const getSeverityBadge = (severity: ProblemSeverity) => {
    const badges = {
      common: { color: "bg-green-100 text-green-700 border-green-300", label: "Common" },
      moderate: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "Moderate" },
      rare: { color: "bg-red-100 text-red-700 border-red-300", label: "Rare" }
    };
    return badges[severity];
  };

  const renderDeviceList = (devices: Device[]) => {
    return devices.map((device) => {
      const Icon = device.icon;
      const isDeviceExpanded = expandedDevice === device.slug;
      
      return (
        <div key={device.slug} className="border-t border-gray-200 first:border-t-0">
          <button
            onClick={() => toggleDevice(device.slug)}
            className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${device.color} rounded-lg flex items-center justify-center`}>
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
              {/* Group problems by severity */}
              {["common", "moderate", "rare"].map((severity) => {
                const problemsInSeverity = device.problems.filter(
                  (p) => p.severity === severity
                );
                
                if (problemsInSeverity.length === 0) return null;

                const severityKey = `${device.slug}-${severity}`;
                const isSeverityExpanded = expandedSeverity === severityKey;
                const badge = getSeverityBadge(severity as ProblemSeverity);

                return (
                  <div
                    key={severity}
                    id={`severity-${severityKey}`}
                    className="mb-3"
                  >
                    <button
                      onClick={() => toggleSeverity(severityKey)}
                      className={`w-full flex items-center justify-between p-3 bg-white rounded-lg border transition-all duration-300 ${
                        highlightedSeverity === severityKey
                          ? 'border-blue-500 shadow-lg ring-4 ring-blue-100'
                          : 'hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-sm text-gray-600">
                          {problemsInSeverity.length} {problemsInSeverity.length === 1 ? 'issue' : 'issues'}
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
                        {problemsInSeverity.map((problem, problemIndex) => {
                          const guideId = getGuideId(device.name, problem.title);
                          const hasFeedback = feedbackGiven.has(guideId);

                          return (
                            <div
                              key={problemIndex}
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

                              {/* Feedback Section */}
                              <div className="border-t-2 border-blue-100 pt-4 mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                                  Did this guide help you?
                                </p>
                                {!hasFeedback ? (
                                  <div className="flex gap-3 justify-center">
                                    <Button
                                      size="sm"
                                      onClick={() => handleInlineGuideFeedback(true, device, problem)}
                                      className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                                    >
                                      <ThumbsUp className="w-4 h-4 mr-2" />
                                      Yes, it helped!
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleInlineGuideFeedback(false, device, problem)}
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
                                      <span className="text-sm font-medium">Thank you for your feedback!</span>
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
      {/* Admin Toolbar */}
      {isAdmin && (
        <div className="bg-amber-500 border-b-2 border-amber-600 py-3 px-4 sticky top-16 z-40 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white">Admin Mode: You have edit access to all troubleshooting content</span>
            </div>
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setEditMode(!editMode);
                toast.info(editMode ? "Edit mode disabled" : "Edit mode enabled");
              }}
              className={editMode ? "bg-white text-amber-600 hover:bg-gray-100 border-0" : "border-2 border-white text-white hover:bg-amber-600 hover:border-white bg-transparent"}
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? "Exit Edit Mode" : "Enable Edit Mode"}
            </Button>
          </div>
        </div>
      )}

      {/* Header with Logo */}
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

      {/* Smart Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SmartSearchBar devices={[...inputDevices, ...outputDevices]} />
      </div>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Devices */}
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
              <div className="bg-white">
                {renderDeviceList(inputDevices)}
              </div>
            )}
          </Card>

          {/* Output Devices */}
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
              <div className="bg-white">
                {renderDeviceList(outputDevices)}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Support Card */}
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
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-blue-300 hover:bg-blue-50">
                  <Home className="mr-2 w-5 h-5" />
                  Back to Home
                </Button>
              </Link>
              <Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-md">
                  <Mail className="mr-2 w-5 h-5" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* Troubleshooting Guide Modal */}
      {selectedProblem && (
        <TroubleshootingGuideModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          problem={selectedProblem.problem}
          deviceName={selectedProblem.device.name}
          deviceIcon={selectedProblem.device.icon}
          deviceColor={selectedProblem.device.color}
          onFeedback={handleGuideFeedback}
          hasFeedback={feedbackGiven.has(getGuideId(selectedProblem.device.name, selectedProblem.problem.title))}
        />
      )}

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        deviceName={selectedProblem?.device.name}
        problemTitle={selectedProblem?.problem.title}
      />
    </div>
  );
}