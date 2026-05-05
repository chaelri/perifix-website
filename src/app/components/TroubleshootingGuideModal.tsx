import { X, Maximize2, ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";

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

interface TroubleshootingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem;
  deviceName: string;
  deviceIcon: any;
  deviceColor: string;
  onFeedback: (helpful: boolean) => void;
  hasFeedback?: boolean;
}

export function TroubleshootingGuideModal({
  isOpen,
  onClose,
  problem,
  deviceName,
  deviceIcon: Icon,
  deviceColor,
  onFeedback,
  hasFeedback = false,
}: TroubleshootingGuideModalProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(hasFeedback);

  // Update local state when prop changes
  useEffect(() => {
    setFeedbackGiven(hasFeedback);
  }, [hasFeedback, isOpen]);

  const getSeverityBadge = (severity: string) => {
    const badges = {
      common: { color: "bg-green-100 text-green-700 border-green-300", label: "Common Issue" },
      moderate: { color: "bg-orange-100 text-orange-700 border-orange-300", label: "Moderate Issue" },
      rare: { color: "bg-red-100 text-red-700 border-red-300", label: "Rare Issue" }
    };
    return badges[severity as keyof typeof badges];
  };

  const badge = getSeverityBadge(problem.severity);

  const handleFeedback = (helpful: boolean) => {
    setFeedbackGiven(true);
    onFeedback(helpful);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${deviceColor} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-sm text-blue-100">{deviceName}</div>
                  <h2 className="text-white text-2xl">{problem.title}</h2>
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

            {/* Severity Badge */}
            <div className="px-6 py-4 bg-blue-50 border-b">
              <span className={`px-4 py-2 rounded-full text-sm border ${badge.color}`}>
                {badge.label}
              </span>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl mb-6 text-gray-800">Step-by-Step Guide</h3>
                <div className="space-y-6">
                  {problem.steps.map((step) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: step.step * 0.1 }}
                      className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-6">
                        {/* Step Number */}
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-2xl">{step.step}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h4 className="text-xl mb-3 text-gray-900">{step.title}</h4>
                          <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                            {step.description}
                          </p>

                          {/* Image */}
                          <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                            <ImageWithFallback
                              src={step.image}
                              alt={step.title}
                              className="w-full h-64 object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Feedback Section */}
                <div className="mt-12 p-8 bg-gradient-to-br from-amber-50 to-blue-50 rounded-2xl border-2 border-blue-200">
                  <h3 className="text-2xl mb-4 text-center text-gray-900">Did this guide help you?</h3>

                  {!feedbackGiven ? (
                    <div className="flex gap-4 justify-center">
                      <Button
                        size="lg"
                        onClick={() => handleFeedback(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        <ThumbsUp className="w-6 h-6 mr-3" />
                        Yes, it helped!
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleFeedback(false)}
                        className="border-2 border-red-300 text-red-700 hover:bg-red-50 px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        <ThumbsDown className="w-6 h-6 mr-3" />
                        No, I need help
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-xl border-2 border-green-200">
                        <CheckCircle className="w-6 h-6" />
                        <span className="text-lg font-medium">Thank you for your feedback!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
