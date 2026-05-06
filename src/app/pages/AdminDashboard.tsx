import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Shield, Users, UserPlus, BarChart3, AlertCircle, ChevronRight, Wrench } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { FetchingBadge } from "../components/skeletons/Skeletons";

async function fetchUserCounts() {
  const { data, error } = await supabase.from("profiles").select("role");
  if (error) throw error;
  const total = data?.length ?? 0;
  const students = data?.filter((p: any) => p.role === "student").length ?? 0;
  const admins = data?.filter((p: any) => p.role === "admin").length ?? 0;
  return { total, students, admins };
}

async function fetchPendingAccountRequests(): Promise<number> {
  const { count, error } = await supabase
    .from("account_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

async function fetchOpenSupportRequests(): Promise<number> {
  const { count, error } = await supabase
    .from("support_requests")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "priority"]);
  if (error) throw error;
  return count ?? 0;
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: typeof Shield;
  iconBg: string;
  iconFg: string;
  badge?: string | null;
  badgeTone?: "green" | "orange" | "neutral";
  onClick: () => void;
}

function ActionCard({ title, description, icon: Icon, iconBg, iconFg, badge, badgeTone = "neutral", onClick }: ActionCardProps) {
  const badgeClasses =
    badgeTone === "green"
      ? "bg-green-100 text-green-700"
      : badgeTone === "orange"
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 hover:border-gray-300 transition-all p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconFg}`} />
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-base mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </div>
      <div className="mt-auto flex items-center gap-1 text-sm text-blue-600 group-hover:gap-2 transition-all">
        Open
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login-selection");
    }
  }, [user, navigate]);

  const { data: counts, isFetching: countsFetching, isPending: countsPending } = useQuery({
    queryKey: ["admin-user-counts"],
    queryFn: fetchUserCounts,
    enabled: user?.role === "admin",
  });

  const { data: pendingAccounts = 0 } = useQuery({
    queryKey: ["admin-pending-account-requests"],
    queryFn: fetchPendingAccountRequests,
    enabled: user?.role === "admin",
  });

  const { data: openSupport = 0 } = useQuery({
    queryKey: ["admin-open-support-requests"],
    queryFn: fetchOpenSupportRequests,
    enabled: user?.role === "admin",
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Compact heading + counts strip */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <Shield className="w-3.5 h-3.5" />
              Admin Panel
            </div>
            <h1 className="mb-0">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FetchingBadge isFetching={countsFetching} isPending={countsPending} />
            <div className="flex items-center divide-x divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-2">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-lg leading-tight">{counts?.total ?? "—"}</div>
              </div>
              <div className="px-4 py-2">
                <div className="text-xs text-muted-foreground">Students</div>
                <div className="text-lg leading-tight">{counts?.students ?? "—"}</div>
              </div>
              <div className="px-4 py-2">
                <div className="text-xs text-muted-foreground">Admins</div>
                <div className="text-lg leading-tight">{counts?.admins ?? "—"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action grid — what an admin actually came here to do */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            title="Account Requests"
            description="Review and approve student account requests"
            icon={UserPlus}
            iconBg="bg-green-100"
            iconFg="text-green-600"
            badge={pendingAccounts > 0 ? `${pendingAccounts} pending` : null}
            badgeTone="green"
            onClick={() => navigate("/accounts-list")}
          />
          <ActionCard
            title="User Accounts"
            description="Edit user information and manage passwords"
            icon={Users}
            iconBg="bg-blue-100"
            iconFg="text-blue-600"
            onClick={() => navigate("/user-accounts")}
          />
          <ActionCard
            title="Support Requests"
            description="Manage and respond to user support tickets"
            icon={AlertCircle}
            iconBg="bg-orange-100"
            iconFg="text-orange-600"
            badge={openSupport > 0 ? `${openSupport} open` : null}
            badgeTone="orange"
            onClick={() => navigate("/support-requests")}
          />
          <ActionCard
            title="Analytics"
            description="View troubleshooting success rates and user feedback"
            icon={BarChart3}
            iconBg="bg-purple-100"
            iconFg="text-purple-600"
            onClick={() => navigate("/analytics")}
          />
          <ActionCard
            title="Troubleshooting CMS"
            description="Manage devices, problems, and step-by-step guides"
            icon={Wrench}
            iconBg="bg-amber-100"
            iconFg="text-amber-600"
            onClick={() => navigate("/admin/troubleshooting")}
          />
        </div>

        <div className="mt-8">
          <Button variant="outline" onClick={() => navigate("/")}>
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
