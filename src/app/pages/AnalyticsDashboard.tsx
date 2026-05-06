import { useState, useEffect, useMemo } from "react";
import { Card } from "../components/ui/card";
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Calendar as DateCalendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../utils/firebase/client";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { StatRowSkeleton, FetchingBadge } from "../components/skeletons/Skeletons";
import type { DateRange } from "react-day-picker";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface FeedbackRecord {
  id: string;
  device_slug: string | null;
  problem_slug: string | null;
  helpful: boolean;
  created_at: string;
}

async function fetchAnalytics() {
  const [fbSnap, devSnap, probSnap] = await Promise.all([
    getDocs(query(collection(db, "troubleshooting_feedback"), orderBy("created_at", "desc"))),
    getDocs(collection(db, "devices")),
    getDocs(collection(db, "problems")),
  ]);

  // Use plain objects (not Map) — react-query cache persists to localStorage
  // as JSON and Maps round-trip to {}.
  const deviceMap: Record<string, string> = {};
  devSnap.forEach((d) => {
    const data = d.data();
    if (data.slug) deviceMap[data.slug as string] = data.name;
  });

  const problemMap: Record<string, string> = {};
  probSnap.forEach((d) => {
    const data = d.data();
    if (data.slug) problemMap[data.slug as string] = data.title;
  });

  const feedback: FeedbackRecord[] = fbSnap.docs.map((d) => {
    const data = d.data();
    const created =
      data.created_at instanceof Timestamp
        ? data.created_at.toDate().toISOString()
        : data.created_at ?? "";
    return {
      id: d.id,
      device_slug: data.device_slug ?? null,
      problem_slug: data.problem_slug ?? null,
      helpful: !!data.helpful,
      created_at: created,
    };
  });

  return { feedback, deviceMap, problemMap };
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    enabled: user?.role === "admin",
  });

  const feedback = data?.feedback ?? [];
  const deviceMap: Record<string, string> = data?.deviceMap ?? {};
  const problemMap: Record<string, string> = data?.problemMap ?? {};

  const filteredFeedback = useMemo(() => {
    let filtered = [...feedback];

    if (dateRange?.from) {
      const fromMs = startOfDay(dateRange.from).getTime();
      const toMs = endOfDay(dateRange.to ?? dateRange.from).getTime();
      filtered = filtered.filter((f) => {
        const t = new Date(f.created_at).getTime();
        return t >= fromMs && t <= toMs;
      });
    }

    if (selectedDevice !== "all") {
      filtered = filtered.filter((f) => f.device_slug === selectedDevice);
    }

    return filtered;
  }, [feedback, dateRange, selectedDevice]);

  const stats = useMemo(() => {
    const total = filteredFeedback.length;
    const successful = filteredFeedback.filter((f) => f.helpful).length;
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : "0";

    const deviceCounts: Record<string, number> = {};
    filteredFeedback.forEach((f) => {
      const name = deviceMap[f.device_slug ?? ""] ?? f.device_slug ?? "Unknown";
      deviceCounts[name] = (deviceCounts[name] || 0) + 1;
    });

    const problemCounts: Record<string, number> = {};
    filteredFeedback
      .filter((f) => f.helpful)
      .forEach((f) => {
        const deviceName = deviceMap[f.device_slug ?? ""] ?? f.device_slug ?? "Unknown";
        const problemTitle = problemMap[f.problem_slug ?? ""] ?? f.problem_slug ?? "Unknown";
        const key = `${deviceName} - ${problemTitle}`;
        problemCounts[key] = (problemCounts[key] || 0) + 1;
      });

    const topProblems = Object.entries(problemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topDevices = Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total, successful, successRate, topProblems, topDevices, deviceCounts };
  }, [filteredFeedback, deviceMap, problemMap]);

  const uniqueDeviceSlugs = useMemo(() => {
    const slugs = new Set<string>();
    feedback.forEach((f) => f.device_slug && slugs.add(f.device_slug));
    return Array.from(slugs);
  }, [feedback]);

  const exportData = () => {
    const headers = [
      "Date",
      "Time",
      "Device",
      "Problem",
      "Helpful",
      "Device Slug",
      "Problem Slug",
    ];

    const csvCell = (value: unknown): string => {
      const s = value == null ? "" : String(value);
      // RFC 4180: quote if it contains comma, quote, or newline; double internal quotes.
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const rows = filteredFeedback.map((f) => {
      const d = new Date(f.created_at);
      const date = Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const time = Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleTimeString("en-GB", { hour12: false });
      return [
        date,
        time,
        deviceMap[f.device_slug ?? ""] ?? f.device_slug ?? "",
        problemMap[f.problem_slug ?? ""] ?? f.problem_slug ?? "",
        f.helpful ? "Yes" : "No",
        f.device_slug ?? "",
        f.problem_slug ?? "",
      ];
    });

    const csv = [headers, ...rows]
      .map((r) => r.map(csvCell).join(","))
      .join("\r\n");

    // BOM so Excel detects UTF-8 correctly (otherwise non-ASCII bytes garble).
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `perifix-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="mb-2">Analytics Dashboard</h1>
              <p className="text-xl text-muted-foreground">
                Track troubleshooting success and user feedback
              </p>
            </div>
            <Button
              onClick={exportData}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              disabled={filteredFeedback.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 px-4 py-2 text-sm hover:border-blue-300 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    {dateRange?.from
                      ? dateRange.to
                        ? `${fmtDate(dateRange.from)} – ${fmtDate(dateRange.to)}`
                        : fmtDate(dateRange.from)
                      : "All time"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-wrap gap-1.5 p-3 border-b border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const to = new Date();
                      const from = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
                      setDateRange({ from, to });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const to = new Date();
                      const from = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
                      setDateRange({ from, to });
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      const now = new Date();
                      const from = new Date(now.getFullYear(), now.getMonth(), 1);
                      setDateRange({ from, to: now });
                    }}
                  >
                    This month
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setDateRange(undefined)}
                  >
                    All time
                  </Button>
                </div>
                <DateCalendar
                  mode="range"
                  numberOfMonths={2}
                  selected={dateRange}
                  onSelect={setDateRange}
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-[180px] bg-white border-2 border-gray-200 rounded-xl h-auto py-2 gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <SelectValue placeholder="All devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All devices</SelectItem>
                {uniqueDeviceSlugs.map((slug) => (
                  <SelectItem key={slug} value={slug}>
                    {deviceMap[slug] ?? slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-3 flex justify-end min-h-[28px]">
          <FetchingBadge isFetching={isFetching} isPending={isPending} />
        </div>
        {isPending ? (
          <StatRowSkeleton count={3} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
                    <h3 className="text-3xl mb-1">{stats.total}</h3>
                    <p className="text-sm text-muted-foreground">All time responses</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Successful Fixes</p>
                    <h3 className="text-3xl mb-1">{stats.successful}</h3>
                    <p className="text-sm text-muted-foreground">
                      Problems resolved successfully
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                    <h3 className="text-3xl mb-1">{stats.successRate}%</h3>
                    <p className="text-sm text-muted-foreground">Guides marked as helpful</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="mb-6 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Most Solved Issues
                </h3>
                <div className="space-y-4">
                  {stats.topProblems.length > 0 ? (
                    stats.topProblems.map(([problem, count], index) => {
                      const maxCount = stats.topProblems[0][1];
                      const percentage = (count / maxCount) * 100;

                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                              {problem}
                            </span>
                            <span className="text-sm font-semibold text-blue-700">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Device Usage Breakdown
                </h3>
                <div className="space-y-4">
                  {stats.topDevices.length > 0 ? (
                    stats.topDevices.map(([device, count], index) => {
                      const maxCount = stats.topDevices[0][1];
                      const percentage = (count / maxCount) * 100;
                      const colors = [
                        "from-blue-600 to-blue-500",
                        "from-purple-600 to-purple-500",
                        "from-teal-600 to-teal-500",
                        "from-orange-600 to-orange-500",
                        "from-pink-600 to-pink-500",
                      ];

                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-700">{device}</span>
                            <span className="text-sm font-semibold text-blue-700">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`bg-gradient-to-r ${colors[index % colors.length]} h-2.5 rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
