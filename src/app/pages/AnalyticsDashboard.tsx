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
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { StatRowSkeleton, FetchingBadge } from "../components/skeletons/Skeletons";

interface FeedbackRecord {
  id: number;
  device_slug: string | null;
  problem_slug: string | null;
  helpful: boolean;
  created_at: string;
}

async function fetchAnalytics() {
  const [fb, devs, probs] = await Promise.all([
    supabase
      .from("troubleshooting_feedback")
      .select("id, device_slug, problem_slug, helpful, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("devices").select("slug, name"),
    supabase.from("problems").select("slug, title"),
  ]);
  if (fb.error) throw fb.error;
  if (devs.error) throw devs.error;
  if (probs.error) throw probs.error;

  // Use plain objects (not Map). The react-query cache is persisted to
  // localStorage as JSON, and Maps round-trip to {} — so on the next page
  // load deviceMap[...] would throw "g.get is not a function".
  const deviceMap: Record<string, string> = {};
  for (const d of (devs.data ?? []) as any[]) deviceMap[d.slug] = d.name;

  const problemMap: Record<string, string> = {};
  for (const p of (probs.data ?? []) as any[]) problemMap[p.slug] = p.title;

  return {
    feedback: (fb.data ?? []) as FeedbackRecord[],
    deviceMap,
    problemMap,
  };
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");

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

    if (timeRange !== "all") {
      const days = parseInt(timeRange);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((f) => new Date(f.created_at) >= cutoff);
    }

    if (selectedDevice !== "all") {
      filtered = filtered.filter((f) => f.device_slug === selectedDevice);
    }

    return filtered;
  }, [feedback, timeRange, selectedDevice]);

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
    const enriched = filteredFeedback.map((f) => ({
      ...f,
      device_name: deviceMap[f.device_slug ?? ""] ?? null,
      problem_title: problemMap[f.problem_slug ?? ""] ?? null,
    }));
    const dataStr = JSON.stringify(enriched, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

            <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 px-4 py-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 px-4 py-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="text-sm bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="all">All Devices</option>
                {uniqueDeviceSlugs.map((slug) => (
                  <option key={slug} value={slug}>
                    {deviceMap[slug] ?? slug}
                  </option>
                ))}
              </select>
            </div>
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
