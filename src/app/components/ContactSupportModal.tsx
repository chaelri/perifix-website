import { X, Send, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";
import { useAuth } from "../contexts/AuthContext";

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceName?: string;
  problemTitle?: string;
}

export function ContactSupportModal({
  isOpen,
  onClose,
  deviceName = "",
  problemTitle = "",
}: ContactSupportModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    device: deviceName,
    issue: problemTitle,
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        device: deviceName || "",
        issue: problemTitle || "",
        name: prev.name || user?.name || "",
        email: prev.email || user?.email || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        name: "",
        email: "",
        description: "",
      }));
    }
  }, [isOpen, deviceName, problemTitle, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("support_requests").insert({
        user_id: user?.id ?? null,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        device: formData.device.trim() || null,
        issue: formData.issue.trim() || null,
        description: formData.description.trim(),
        source: "troubleshooting",
      });
      if (error) {
        toast.error(error.message || "Failed to submit support request.");
        return;
      }
      toast.success("Support request submitted!", {
        description: "Our team will review your request and get back to you soon.",
      });
      setFormData({ name: "", email: "", device: "", issue: "", description: "" });
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit support request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[102]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-3xl shadow-2xl z-[103] overflow-hidden max-h-[90vh] flex flex-col mx-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-2xl">Contact Support</h2>
                  <p className="text-sm text-blue-100">We're here to help you</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Form - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                  />
                </div>

                {/* Device Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device Type <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="device"
                    value={formData.device}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Mouse, Keyboard, Printer"
                    className="h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                  />
                </div>

                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Type <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    name="issue"
                    value={formData.issue}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Device not detected, Not working properly"
                    className="h-12 border-2 border-gray-300 focus:border-blue-500 rounded-xl"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe Your Problem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Please provide as much detail as possible about the issue you're experiencing..."
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-xl resize-none focus:outline-none focus:ring-0"
                  />
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Our support team typically responds within 24-48
                    hours. For urgent issues, please contact your IT administrator directly.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-100 rounded-xl text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl text-base"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
