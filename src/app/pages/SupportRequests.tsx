import { useState, useEffect, useMemo } from "react";
import { Card } from "../components/ui/card";
import {
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search as SearchIcon,
  Eye,
  Trash2,
  Flag
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface SupportRequest {
  id: string;
  name: string;
  email: string;
  device: string;
  issue: string;
  description: string;
  timestamp: string;
  status: "pending" | "resolved" | "priority";
}

export function SupportRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  useEffect(() => {
    // Redirect if not admin
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }

    // Load support requests from localStorage
    loadRequests();
  }, [user, navigate]);

  const loadRequests = () => {
    const stored = JSON.parse(localStorage.getItem("support_requests") || "[]");
    setRequests(stored);
  };

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query) ||
          r.device.toLowerCase().includes(query) ||
          r.issue.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    // Sort by timestamp (newest first)
    return filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [requests, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      resolved: requests.filter((r) => r.status === "resolved").length,
      priority: requests.filter((r) => r.status === "priority").length,
    };
  }, [requests]);

  const updateRequestStatus = (id: string, status: SupportRequest["status"]) => {
    const updated = requests.map((r) =>
      r.id === id ? { ...r, status } : r
    );
    setRequests(updated);
    localStorage.setItem("support_requests", JSON.stringify(updated));
    toast.success("Request updated", {
      description: `Status changed to ${status}`,
    });
  };

  const deleteRequest = (id: string) => {
    const updated = requests.filter((r) => r.id !== id);
    setRequests(updated);
    localStorage.setItem("support_requests", JSON.stringify(updated));
    toast.success("Request deleted");
    if (selectedRequest?.id === id) {
      setViewModalOpen(false);
      setSelectedRequest(null);
    }
  };

  const viewRequest = (request: SupportRequest) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: SupportRequest["status"]) => {
    const badges = {
      pending: {
        color: "bg-orange-100 text-orange-700 border-orange-300",
        icon: Clock,
        label: "Pending",
      },
      resolved: {
        color: "bg-green-100 text-green-700 border-green-300",
        icon: CheckCircle,
        label: "Resolved",
      },
      priority: {
        color: "bg-red-100 text-red-700 border-red-300",
        icon: Flag,
        label: "Priority",
      },
    };
    return badges[status];
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Support Requests</h1>
          <p className="text-xl text-muted-foreground">
            Manage and respond to user support tickets
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <h3 className="text-2xl">{stats.total}</h3>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <h3 className="text-2xl">{stats.pending}</h3>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-white border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <h3 className="text-2xl">{stats.priority}</h3>
              </div>
              <Flag className="w-8 h-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <h3 className="text-2xl">{stats.resolved}</h3>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search requests by name, email, device, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-gray-200 px-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm bg-transparent border-none focus:outline-none cursor-pointer h-12"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="priority">Priority</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <Card className="overflow-hidden">
          {filteredRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Requester
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Device
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Issue
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => {
                    const badge = getStatusBadge(request.status);
                    const StatusIcon = badge.icon;

                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {request.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {request.device}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                          {request.issue}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(request.timestamp)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs border inline-flex items-center gap-1 ${badge.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewRequest(request)}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRequest(request.id)}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl mb-2 text-gray-700">No requests found</h3>
              <p className="text-gray-500">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Support requests will appear here"}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* View Request Modal */}
      <AnimatePresence>
        {viewModalOpen && selectedRequest && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden max-h-[90vh] flex flex-col mx-4"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-white text-2xl">Support Request Details</h2>
                  <p className="text-sm text-blue-100">
                    Submitted {formatDate(selectedRequest.timestamp)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-xl"
                >
                  <span className="text-2xl">&times;</span>
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Name</p>
                      <p className="text-lg text-gray-900">{selectedRequest.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                      <p className="text-lg text-gray-900">{selectedRequest.email}</p>
                    </div>
                  </div>

                  {/* Device & Issue */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Device</p>
                      <p className="text-lg text-gray-900">{selectedRequest.device}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Issue Type</p>
                      <p className="text-lg text-gray-900">{selectedRequest.issue}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Problem Description
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <p className="text-gray-800 leading-relaxed">
                        {selectedRequest.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">Update Status</p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          updateRequestStatus(selectedRequest.id, "pending")
                        }
                        variant={
                          selectedRequest.status === "pending" ? "default" : "outline"
                        }
                        className={
                          selectedRequest.status === "pending"
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "border-orange-300 text-orange-700 hover:bg-orange-50"
                        }
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Mark as Pending
                      </Button>
                      <Button
                        onClick={() =>
                          updateRequestStatus(selectedRequest.id, "priority")
                        }
                        variant={
                          selectedRequest.status === "priority" ? "default" : "outline"
                        }
                        className={
                          selectedRequest.status === "priority"
                            ? "bg-red-600 hover:bg-red-700"
                            : "border-red-300 text-red-700 hover:bg-red-50"
                        }
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Mark as Priority
                      </Button>
                      <Button
                        onClick={() =>
                          updateRequestStatus(selectedRequest.id, "resolved")
                        }
                        variant={
                          selectedRequest.status === "resolved" ? "default" : "outline"
                        }
                        className={
                          selectedRequest.status === "resolved"
                            ? "bg-green-600 hover:bg-green-700"
                            : "border-green-300 text-green-700 hover:bg-green-50"
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Resolved
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setViewModalOpen(false)}
                    className="flex-1 border-gray-300 hover:bg-gray-100 h-12 rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => deleteRequest(selectedRequest.id)}
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50 h-12 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Request
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
