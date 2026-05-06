import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Mail, Phone, Facebook, MapPin, Clock, Lightbulb, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../utils/supabase/client";
import { useAuth } from "../contexts/AuthContext";

export function Contact() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name);
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("support_requests").insert({
        user_id: user?.id ?? null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        issue: subject.trim() || null,
        description: message.trim(),
        source: "contact",
      });
      if (error) {
        toast.error(error.message || "Failed to send message.");
        return;
      }
      toast.success("Message sent! We'll get back to you soon.");
      setSubject("");
      setMessage("");
      if (!user) {
        setName("");
        setEmail("");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50/30 to-amber-50/30">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full mb-4">
            We're Here to Help
          </div>
          <h1 className="mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground">
            Have questions or need help? We're here to assist you.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div>
            <div className="bg-white rounded-3xl p-8 shadow-lg mb-8">
              <h2 className="mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Our support team is available to help you with any questions or issues you may have with PERIFIX or peripheral device troubleshooting.
              </p>

              <div className="space-y-4">
                <Card className="p-6 hover:shadow-md transition-shadow border-2 border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="mb-1">Email</h4>
                      <p className="text-muted-foreground">perifix@support.com</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        We'll respond within 24 hours
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-md transition-shadow border-2 border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="mb-1">Phone</h4>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Mon-Fri, 9:00 AM - 6:00 PM EST
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-md transition-shadow border-2 border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="mb-1">Facebook Page</h4>
                      <p className="text-muted-foreground">@PerifixSupport</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Message us for quick responses
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-md transition-shadow border-2 border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="mb-1">Address</h4>
                      <p className="text-muted-foreground">
                        123 Tech Support Lane<br />
                        Silicon Valley, CA 94025
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-md transition-shadow border-2 border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="mb-1">Support Hours</h4>
                      <p className="text-muted-foreground">
                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                        Saturday: 10:00 AM - 4:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="p-8 shadow-xl bg-white">
              <h2 className="mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="What is this regarding?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue or question in detail..."
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending…" : "Send Message"}
                </Button>
              </form>
            </Card>

            <div className="mt-6 p-6 bg-white rounded-2xl shadow-md border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-100">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <h4 className="m-0 text-blue-900">Quick Tips</h4>
              </div>
              <ul className="space-y-3">
                {[
                  "Include specific device model numbers when possible",
                  "Describe what steps you've already tried",
                  "Attach screenshots if relevant (email only)",
                  "Check our troubleshooting guides first for instant solutions",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 text-center text-white shadow-xl">
          <h2 className="mb-4 text-white">Before you contact us...</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Most issues can be resolved quickly using our visual troubleshooting guides. Try searching for your device first!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/troubleshooting">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Browse Troubleshooting Guides
              </Button>
            </a>
            <a href="/devices">
              <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-blue-100 border-white">
                View All Devices
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}