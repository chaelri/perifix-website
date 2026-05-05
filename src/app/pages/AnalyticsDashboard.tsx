import { useState, useEffect, useMemo } from "react";
import { Card } from "../components/ui/card";
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Filter,
  Download,
  Calendar
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface FeedbackRecord {
  device: string;
  problem: string;
  helpful: boolean;
  timestamp: string;
}

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("all");

  useEffect(() => {
    // Redirect if not admin
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }

    // Load feedback from localStorage
    const storedFeedback = JSON.parse(
      localStorage.getItem("troubleshooting_feedback") || "[]"
    );
    setFeedback(storedFeedback);
  }, [user, navigate]);

  // Filter feedback by time range
  const filteredFeedback = useMemo(() => {
    let filtered = [...feedback];

    if (timeRange !== "all") {
      const now = new Date();
      const days = parseInt(timeRange);
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(
        (f) => new Date(f.timestamp) >= cutoff
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((f) => f.device === selectedCategory);
    }

    return filtered;
  }, [feedback, timeRange, selectedCategory]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredFeedback.length;
    const successful = filteredFeedback.filter((f) => f.helpful).length;
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : "0";

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    filteredFeedback.forEach((f) => {
      deviceCounts[f.device] = (deviceCounts[f.device] || 0) + 1;
    });

    // Problem breakdown
    const problemCounts: Record<string, number> = {};
    filteredFeedback.filter(f => f.helpful).forEach((f) => {
      const key = `${f.device} - ${f.problem}`;
      problemCounts[key] = (problemCounts[key] || 0) + 1;
    });

    const topProblems = Object.entries(problemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topDevices = Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      successful,
      successRate,
      topProblems,
      topDevices,
      deviceCounts,
    };
  }, [filteredFeedback]);

  const uniqueDevices = useMemo(() => {
    const devices = new Set(feedback.map((f) => f.device));
    return Array.from(devices);
  }, [feedback]);

  const exportData = () => {
    const dataStr = JSON.stringify(filteredFeedback, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
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
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            {/* Time Range Filter */}
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

            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 px-4 py-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="all">All Devices</option>
                {uniqueDevices.map((device) => (
                  <option key={device} value={device}>
                    {device}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Completions */}
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

          {/* Successful Resolutions */}
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

          {/* Success Rate */}
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <h3 className="text-3xl mb-1">{stats.successRate}%</h3>
                <p className="text-sm text-muted-foreground">
                  Guides marked as helpful
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Solved Problems */}
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
                        <span className="text-sm font-semibold text-blue-700">
                          {count}
                        </span>
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

          {/* Device Category Breakdown */}
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
                        <span className="text-sm font-semibold text-blue-700">
                          {count}
                        </span>
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
      </div>
    </div>
  );
}
