import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  ArrowLeft,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  X,
  Save,
  GripVertical,
  Upload,
  Link2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ListSkeleton, FetchingBadge } from "../components/skeletons/Skeletons";

type Severity = "common" | "moderate" | "rare";
type Category = "input" | "output";

interface Step {
  step: number;
  title: string;
  description: string;
  image: string;
}

interface DeviceRow {
  id: number;
  slug: string;
  name: string;
  category: Category;
  icon_name: string | null;
  color_class: string | null;
  display_order: number;
}

interface ProblemRow {
  id: number;
  device_id: number;
  slug: string;
  title: string;
  severity: Severity;
  steps: Step[];
  display_order: number;
}

const ICON_OPTIONS = ["Keyboard", "Mouse", "Camera", "Usb", "Cable", "Monitor", "Printer", "Volume2", "Projector"];
const COLOR_OPTIONS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-green-500",
  "bg-red-500",
  "bg-pink-500",
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchDevices(): Promise<DeviceRow[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("id, slug, name, category, icon_name, color_class, display_order")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DeviceRow[];
}

async function fetchProblems(): Promise<ProblemRow[]> {
  const { data, error } = await supabase
    .from("problems")
    .select("id, device_id, slug, title, severity, steps, display_order")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    steps: (p.steps as Step[]) ?? [],
  })) as ProblemRow[];
}

// ---------------------------------------------------------------------------
// Device modal
// ---------------------------------------------------------------------------

interface DeviceModalProps {
  initial: DeviceRow | null;
  onClose: () => void;
  onSaved: () => void;
}

function DeviceModal({ initial, onClose, onSaved }: DeviceModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [category, setCategory] = useState<Category>(initial?.category ?? "input");
  const [iconName, setIconName] = useState(initial?.icon_name ?? "Mouse");
  const [colorClass, setColorClass] = useState(initial?.color_class ?? "bg-blue-500");
  const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 100);
  const [saving, setSaving] = useState(false);

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      category,
      icon_name: iconName,
      color_class: colorClass,
      display_order: displayOrder,
    };
    const op = initial
      ? supabase.from("devices").update(payload).eq("id", initial.id)
      : supabase.from("devices").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) {
      toast.error(error.message || "Save failed.");
      return;
    }
    toast.success(initial ? "Device updated." : "Device created.");
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2>{initial ? "Edit Device" : "New Device"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="d-name">Name</Label>
            <Input
              id="d-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="d-slug">Slug</Label>
            <Input
              id="d-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
              className="mt-1"
              placeholder="e.g. mouse"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="d-category">Category</Label>
              <select
                id="d-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-1 w-full h-9 px-3 rounded-md border border-gray-200 bg-white"
              >
                <option value="input">Input</option>
                <option value="output">Output</option>
              </select>
            </div>
            <div>
              <Label htmlFor="d-order">Display order</Label>
              <Input
                id="d-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="d-icon">Icon</Label>
            <select
              id="d-icon"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-md border border-gray-200 bg-white"
            >
              {ICON_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Color</Label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorClass(c)}
                  className={`w-9 h-9 rounded-lg ${c} ${
                    colorClass === c ? "ring-2 ring-offset-2 ring-gray-700" : ""
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step image field — file upload with preview, falls back to URL paste
// ---------------------------------------------------------------------------

interface StepImageFieldProps {
  value: string;
  onChange: (url: string) => void;
}

function StepImageField({ value, onChange }: StepImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `steps/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("step-images")
        .upload(path, file, {
          cacheControl: "31536000",
          contentType: file.type,
          upsert: false,
        });
      if (upErr) {
        toast.error(upErr.message || "Upload failed.");
        return;
      }
      const { data: pub } = supabase.storage.from("step-images").getPublicUrl(path);
      if (!pub?.publicUrl) {
        toast.error("Could not get a public URL for the uploaded image.");
        return;
      }
      onChange(pub.publicUrl);
      toast.success("Image uploaded.");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (file) void handleFile(file);
  };

  if (value) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
          <img src={value} alt="Step preview" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={onPickFile}
              disabled={uploading}
            />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer">
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              {uploading ? "Uploading…" : "Replace"}
            </span>
          </label>
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="cursor-pointer flex-1">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={onPickFile}
            disabled={uploading}
          />
          <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer text-gray-600">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading…" : "Upload image"}
          </span>
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput((s) => !s)}
          className="px-2 py-2 text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
          title="Paste a URL instead"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {showUrlInput && (
        <Input
          placeholder="…or paste image URL"
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Problem modal
// ---------------------------------------------------------------------------

interface ProblemModalProps {
  deviceId: number;
  initial: ProblemRow | null;
  onClose: () => void;
  onSaved: () => void;
}

function ProblemModal({ deviceId, initial, onClose, onSaved }: ProblemModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [severity, setSeverity] = useState<Severity>(initial?.severity ?? "common");
  const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 100);
  const [steps, setSteps] = useState<Step[]>(
    initial?.steps?.length
      ? initial.steps.map((s, i) => ({ ...s, step: i + 1 }))
      : [{ step: 1, title: "", description: "", image: "" }],
  );
  const [saving, setSaving] = useState(false);

  const onTitleChange = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const updateStep = (idx: number, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((s, i) => ({ ...s, step: i + 1 }));
    });
  };

  const removeStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })));
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { step: prev.length + 1, title: "", description: "", image: "" }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.length === 0) {
      toast.error("Add at least one step.");
      return;
    }
    setSaving(true);
    const cleanSteps = steps.map((s, i) => ({
      step: i + 1,
      title: s.title.trim(),
      description: s.description.trim(),
      image: s.image.trim(),
    }));
    const payload = {
      device_id: deviceId,
      title: title.trim(),
      slug: slug.trim(),
      severity,
      display_order: displayOrder,
      steps: cleanSteps,
    };
    const op = initial
      ? supabase.from("problems").update(payload).eq("id", initial.id)
      : supabase.from("problems").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) {
      toast.error(error.message || "Save failed.");
      return;
    }
    toast.success(initial ? "Problem updated." : "Problem created.");
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2>{initial ? "Edit Problem" : "New Problem"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <Label htmlFor="p-title">Title</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
              className="mt-1"
              placeholder="e.g. Mouse Not Responding"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p-slug">Slug</Label>
              <Input
                id="p-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="p-severity">Severity</Label>
              <select
                id="p-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="mt-1 w-full h-9 px-3 rounded-md border border-gray-200 bg-white"
              >
                <option value="common">Common</option>
                <option value="moderate">Moderate</option>
                <option value="rare">Rare</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="p-order">Display order</Label>
            <Input
              id="p-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Label>Steps ({steps.length})</Label>
              <Button type="button" size="sm" variant="outline" onClick={addStep}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add step
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((s, idx) => (
                <Card key={idx} className="p-3 border border-gray-200 bg-gray-50/40">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex flex-col gap-1 pt-1">
                      <GripVertical className="w-4 h-4 text-gray-300" />
                      <span className="text-xs font-semibold text-gray-500 text-center">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-2">
                      <Input
                        placeholder="Step title"
                        value={s.title}
                        onChange={(e) => updateStep(idx, { title: e.target.value })}
                      />
                      <Textarea
                        placeholder="Step description"
                        value={s.description}
                        onChange={(e) => updateStep(idx, { description: e.target.value })}
                        rows={2}
                      />
                      <StepImageField
                        value={s.image}
                        onChange={(url) => updateStep(idx, { image: url })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => moveStep(idx, -1)}
                        disabled={idx === 0}
                        className="h-7 w-7"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => moveStep(idx, 1)}
                        disabled={idx === steps.length - 1}
                        className="h-7 w-7"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeStep(idx)}
                        className="h-7 w-7 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function TroubleshootingAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null);
  const [editingDevice, setEditingDevice] = useState<DeviceRow | null>(null);
  const [newDevice, setNewDevice] = useState(false);
  const [editingProblem, setEditingProblem] = useState<{
    deviceId: number;
    initial: ProblemRow | null;
  } | null>(null);

  useEffect(() => {
    if (!user) navigate("/login-selection");
    else if (user.role !== "admin") navigate("/");
  }, [user, navigate]);

  const { data: devices = [], isPending: devicesPending, isFetching: devicesFetching } = useQuery({
    queryKey: ["admin-devices"],
    queryFn: fetchDevices,
    enabled: user?.role === "admin",
  });

  const { data: problems = [], isPending: problemsPending } = useQuery({
    queryKey: ["admin-problems"],
    queryFn: fetchProblems,
    enabled: user?.role === "admin",
  });

  const problemsByDevice = useMemo(() => {
    const map = new Map<number, ProblemRow[]>();
    for (const p of problems) {
      const list = map.get(p.device_id) ?? [];
      list.push(p);
      map.set(p.device_id, list);
    }
    return map;
  }, [problems]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-devices"] });
    queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
    // The public Troubleshooting page uses this cache key — bust it too so
    // the changes show up for end users immediately.
    queryClient.invalidateQueries({ queryKey: ["troubleshooting-tree"] });
  };

  const handleDeleteDevice = async (d: DeviceRow) => {
    const probCount = problemsByDevice.get(d.id)?.length ?? 0;
    const msg =
      probCount > 0
        ? `Delete "${d.name}" and its ${probCount} problem(s)? This cannot be undone.`
        : `Delete "${d.name}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    const { error } = await supabase.from("devices").delete().eq("id", d.id);
    if (error) {
      toast.error(error.message || "Delete failed.");
      return;
    }
    toast.success("Device deleted.");
    refresh();
  };

  const handleDeleteProblem = async (p: ProblemRow) => {
    if (!confirm(`Delete problem "${p.title}"?`)) return;
    const { error } = await supabase.from("problems").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message || "Delete failed.");
      return;
    }
    toast.success("Problem deleted.");
    refresh();
  };

  if (!user || user.role !== "admin") return null;

  const inputDevices = devices.filter((d) => d.category === "input");
  const outputDevices = devices.filter((d) => d.category === "output");

  const renderDevice = (d: DeviceRow) => {
    const isExpanded = expandedDeviceId === d.id;
    const probs = problemsByDevice.get(d.id) ?? [];
    const colorClass = d.color_class || "bg-blue-500";

    return (
      <Card key={d.id} className="border border-gray-200">
        <div className="p-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpandedDeviceId(isExpanded ? null : d.id)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
              {d.icon_name?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{d.name}</span>
                <span className="text-xs text-gray-400">#{d.display_order}</span>
              </div>
              <div className="text-xs text-gray-500">
                {d.slug} · {probs.length} problem{probs.length === 1 ? "" : "s"}
              </div>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingDevice(d)}
              className="border-blue-300"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteDevice(d)}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
            {probs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">No problems yet.</div>
            ) : (
              probs.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{p.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          p.severity === "common"
                            ? "bg-yellow-100 text-yellow-700"
                            : p.severity === "moderate"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.severity}
                      </span>
                      <span className="text-xs text-gray-400">#{p.display_order}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.slug} · {p.steps?.length ?? 0} step{(p.steps?.length ?? 0) === 1 ? "" : "s"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingProblem({ deviceId: d.id, initial: p })}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteProblem(p)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingProblem({ deviceId: d.id, initial: null })}
              className="w-full border-dashed border-gray-300"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add problem
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-amber-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => {
            // Use browser history when the user navigated here from somewhere
            // inside the app (e.g. /troubleshooting → "Manage content"), so
            // they land back at their actual entry point. location.key is
            // "default" only on a fresh page load / direct URL hit.
            if (location.key !== "default") {
              navigate(-1);
            } else {
              navigate("/admin-dashboard");
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="mb-1">Troubleshooting CMS</h1>
              <p className="text-muted-foreground">Manage devices and problem guides</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FetchingBadge isFetching={devicesFetching} isPending={devicesPending} />
            <Button onClick={() => setNewDevice(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Device
            </Button>
          </div>
        </div>

        {devicesPending || problemsPending ? (
          <ListSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">
                Input Devices ({inputDevices.length})
              </h3>
              <div className="space-y-2">
                {inputDevices.length === 0 ? (
                  <Card className="p-4 text-sm text-muted-foreground text-center">
                    No input devices.
                  </Card>
                ) : (
                  inputDevices.map(renderDevice)
                )}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-700">
                Output Devices ({outputDevices.length})
              </h3>
              <div className="space-y-2">
                {outputDevices.length === 0 ? (
                  <Card className="p-4 text-sm text-muted-foreground text-center">
                    No output devices.
                  </Card>
                ) : (
                  outputDevices.map(renderDevice)
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {(editingDevice || newDevice) && (
        <DeviceModal
          initial={editingDevice}
          onClose={() => {
            setEditingDevice(null);
            setNewDevice(false);
          }}
          onSaved={refresh}
        />
      )}

      {editingProblem && (
        <ProblemModal
          deviceId={editingProblem.deviceId}
          initial={editingProblem.initial}
          onClose={() => setEditingProblem(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
