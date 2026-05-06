import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../utils/firebase/client";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import {
  UserPlus,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListSkeleton, FetchingBadge } from "../components/skeletons/Skeletons";

interface AccountRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface ApprovalDetails {
  email: string;
  name: string;
}

async function fetchAccountRequests(): Promise<AccountRequest[]> {
  const q = query(collection(db, "account_requests"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const created =
      data.created_at instanceof Timestamp
        ? data.created_at.toDate().toISOString()
        : data.created_at ?? "";
    return {
      id: d.id,
      first_name: data.first_name ?? "",
      last_name: data.last_name ?? "",
      email: data.email ?? "",
      status: (data.status as AccountRequest["status"]) ?? "pending",
      created_at: created,
    };
  });
}

export function AccountsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState<ApprovalDetails | null>(null);

  const { data: requests = [], isPending, isFetching } = useQuery({
    queryKey: ["account_requests"],
    queryFn: fetchAccountRequests,
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [user, navigate]);

  const handleApprove = async (request: AccountRequest) => {
    setApprovingId(request.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/approve-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken ?? ""}`,
        },
        body: JSON.stringify({ requestId: request.id }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "Failed to approve account.");
        return;
      }
      setApprovalDetails({ email: data.email, name: data.name });
      setShowApprovalDialog(true);
      queryClient.invalidateQueries({ queryKey: ["account_requests"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve account.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (request: AccountRequest) => {
    try {
      await updateDoc(doc(db, "account_requests", request.id), {
        status: "rejected",
      });
      toast.success("Request rejected.");
      queryClient.invalidateQueries({ queryKey: ["account_requests"] });
    } catch (err) {
      toast.error((err as Error).message || "Failed to reject request.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/admin-dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="mb-1">Account Requests</h1>
              <p className="text-muted-foreground">
                Review and manage account requests from users
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {requests.filter((r) => r.status === "pending").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-700">
                  {requests.filter((r) => r.status === "approved").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-700">
                  {requests.filter((r) => r.status === "rejected").length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>

        <Card className="p-6 shadow-xl border-2 border-blue-200">
          <div className="flex justify-end mb-3 -mt-2 min-h-[28px]">
            <FetchingBadge isFetching={isFetching} isPending={isPending} />
          </div>
          {isPending ? (
            <ListSkeleton count={3} />
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">No account requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border-2 border-gray-100 rounded-lg hover:border-blue-200 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg">
                        {request.first_name} {request.last_name}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {request.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested on {formatDate(request.created_at)}
                    </p>
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(request)}
                        disabled={approvingId === request.id}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {approvingId === request.id ? "Approving…" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-100"
                        onClick={() => handleReject(request)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {showApprovalDialog && approvalDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-green-200 max-w-md w-full animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <h2 className="mb-2">Invite Email Sent!</h2>
                <p className="text-muted-foreground mb-6">
                  An invitation email has been sent. The user can click the link to set their
                  password and sign in.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                      <p className="font-medium text-blue-900 break-words">
                        {approvalDetails.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-1">Sent To</p>
                      <p className="font-medium text-blue-900 break-words">
                        {approvalDetails.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
                size="lg"
                onClick={() => setShowApprovalDialog(false)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
