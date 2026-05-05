import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { 
  Search as SearchIcon,
  Mouse,
  Keyboard,
  Camera,
  Usb,
  Cable,
  Monitor,
  Printer,
  Volume2,
  Projector,
  ChevronRight,
  AlertCircle,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "./ui/badge";

interface Step {
  step: number;
  title: string;
  description: string;
  image: string;
}

interface Problem {
  title: string;
  severity: "common" | "moderate" | "rare";
  steps: Step[];
}

interface Device {
  name: string;
  icon: any;
  slug: string;
  color: string;
  problems: Problem[];
  category: "input" | "output";
}

interface SearchResult {
  type: "device" | "problem" | "guide";
  deviceName: string;
  deviceSlug: string;
  deviceIcon: any;
  deviceColor: string;
  deviceCategory: "input" | "output";
  problemTitle?: string;
  severity?: "common" | "moderate" | "rare";
  matchedKeywords?: string[];
}

interface SmartSearchBarProps {
  devices: Device[];
  placeholder?: string;
}

export function SmartSearchBar({ 
  devices, 
  placeholder = "Search your device issue (e.g., mouse not working, printer offline)" 
}: SmartSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search logic with fuzzy matching
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    const keywords = query.split(" ").filter(k => k.length > 0);

    devices.forEach(device => {
      const deviceNameMatch = device.name.toLowerCase().includes(query);
      
      // Check if device name matches
      if (deviceNameMatch) {
        results.push({
          type: "device",
          deviceName: device.name,
          deviceSlug: device.slug,
          deviceIcon: device.icon,
          deviceColor: device.color,
          deviceCategory: device.category,
          matchedKeywords: keywords
        });
      }

      // Check problems for this device
      device.problems.forEach(problem => {
        const problemMatch = problem.title.toLowerCase().includes(query);
        const keywordMatches = keywords.some(keyword => 
          problem.title.toLowerCase().includes(keyword) ||
          device.name.toLowerCase().includes(keyword)
        );

        if (problemMatch || keywordMatches || deviceNameMatch) {
          results.push({
            type: "problem",
            deviceName: device.name,
            deviceSlug: device.slug,
            deviceIcon: device.icon,
            deviceColor: device.color,
            deviceCategory: device.category,
            problemTitle: problem.title,
            severity: problem.severity,
            matchedKeywords: keywords
          });
        }
      });
    });

    // Sort: common problems first, then moderate, then rare
    return results.sort((a, b) => {
      const severityOrder = { common: 0, moderate: 1, rare: 2 };
      const aSeverity = a.severity ? severityOrder[a.severity] : 3;
      const bSeverity = b.severity ? severityOrder[b.severity] : 3;
      return aSeverity - bSeverity;
    }).slice(0, 8); // Limit to 8 results
  }, [searchQuery, devices]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setIsOpen(value.trim().length > 0);
    setHoveredIndex(-1);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "device") {
      navigate(`/troubleshooting?category=${result.deviceCategory}&device=${result.deviceSlug}`);
    } else if (result.type === "problem") {
      navigate(`/troubleshooting?category=${result.deviceCategory}&device=${result.deviceSlug}&severity=${result.severity}`);
    }
    setSearchQuery("");
    setIsOpen(false);
  };

  const highlightText = (text: string, keywords: string[]) => {
    if (!keywords.length) return text;

    let highlightedText = text;
    const parts: { text: string; highlight: boolean }[] = [];
    let currentIndex = 0;

    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      const matches = [...text.matchAll(regex)];
      
      matches.forEach(match => {
        if (match.index !== undefined) {
          if (match.index > currentIndex) {
            parts.push({ text: text.slice(currentIndex, match.index), highlight: false });
          }
          parts.push({ text: match[0], highlight: true });
          currentIndex = match.index + match[0].length;
        }
      });
    });

    if (currentIndex < text.length) {
      parts.push({ text: text.slice(currentIndex), highlight: false });
    }

    // Merge parts and remove duplicates
    const merged: { text: string; highlight: boolean }[] = [];
    parts.forEach(part => {
      if (merged.length === 0 || merged[merged.length - 1].highlight !== part.highlight) {
        merged.push(part);
      } else {
        merged[merged.length - 1].text += part.text;
      }
    });

    return merged.length > 0 ? merged : [{ text, highlight: false }];
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "common":
        return "bg-green-100 text-green-700 border-green-300";
      case "moderate":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "rare":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-3xl mx-auto mb-8">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery.trim().length > 0 && setIsOpen(true)}
          className="pl-14 pr-6 h-14 text-base border-2 border-gray-300 focus:border-blue-500 rounded-2xl shadow-lg focus:shadow-xl transition-all duration-200 bg-white"
        />
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[500px] overflow-y-auto"
          >
            {searchResults.length > 0 ? (
              <div className="py-2">
                {/* Group by device category */}
                {["input", "output"].map(category => {
                  const categoryResults = searchResults.filter(r => r.deviceCategory === category);
                  if (categoryResults.length === 0) return null;

                  return (
                    <div key={category} className="mb-1">
                      {/* Category Header */}
                      <div className="px-4 py-2 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${category === "input" ? "bg-blue-500" : "bg-purple-500"}`} />
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {category === "input" ? "Input Devices" : "Output Devices"}
                          </span>
                        </div>
                      </div>

                      {/* Results for this category */}
                      {categoryResults.map((result, index) => {
                        const Icon = result.deviceIcon;
                        const globalIndex = searchResults.indexOf(result);
                        const isHovered = hoveredIndex === globalIndex;

                        return (
                          <motion.div
                            key={`${result.deviceSlug}-${result.problemTitle || "device"}-${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <button
                              onClick={() => handleResultClick(result)}
                              onMouseEnter={() => setHoveredIndex(globalIndex)}
                              onMouseLeave={() => setHoveredIndex(-1)}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-150 ${
                                isHovered ? "bg-blue-50" : "hover:bg-gray-50"
                              }`}
                            >
                              {/* Device Icon */}
                              <div className={`w-10 h-10 ${result.deviceColor} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 text-left min-w-0">
                                {result.type === "device" ? (
                                  <div className="font-medium text-gray-900">
                                    {highlightText(result.deviceName, result.matchedKeywords || []).map((part, i) => (
                                      <span key={i} className={part.highlight ? "bg-yellow-200 text-gray-900" : ""}>
                                        {part.text}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-sm text-gray-500 mb-0.5">{result.deviceName}</div>
                                    <div className="font-medium text-gray-900">
                                      {result.problemTitle && highlightText(result.problemTitle, result.matchedKeywords || []).map((part, i) => (
                                        <span key={i} className={part.highlight ? "bg-yellow-200 text-gray-900" : ""}>
                                          {part.text}
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {result.severity === "common" && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-blue-700" />
                                    <span className="text-xs">Recommended</span>
                                  </Badge>
                                )}
                                {result.severity && (
                                  <span className={`px-2 py-1 rounded-full text-xs border ${getSeverityColor(result.severity)}`}>
                                    {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
                                  </span>
                                )}
                                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isHovered ? "translate-x-1" : ""}`} />
                              </div>
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* No Results State */
              <div className="py-12 px-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  We couldn't find any devices or issues matching "{searchQuery}"
                </p>
                <p className="text-xs text-gray-500">
                  Try browsing by category or use different keywords
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
