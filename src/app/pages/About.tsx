import { Card } from "../components/ui/card";
import { Target, Eye, BookOpen } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import logoImage from "../assets/perifix-logo.png";

export function About() {
  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50/30 to-amber-50/30">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <img src={logoImage} alt="PERIFIX Logo" className="w-24 h-24 object-contain" />
          </div>
          <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full mb-4">
            Learn About Us
          </div>
          <h1 className="mb-4">About PERIFIX</h1>
          <p className="text-xl text-muted-foreground">
            Empowering users to solve peripheral connectivity issues independently
          </p>
        </div>
      </div>

      {/* Main Content Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1632910121591-29e2484c0259?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwc3VwcG9ydCUyMHRlYW13b3JrfGVufDF8fHx8MTc2MzM2NzgxNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Tech support teamwork"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="order-1 lg:order-2 bg-white rounded-3xl p-8 shadow-lg">
            <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full mb-4">
              Our Story
            </div>
            <h2 className="mb-6">What is PERIFIX?</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                PERIFIX is a visual troubleshooting guide created specifically to help non-ICT users solve common peripheral device connectivity issues. We understand that technology can be frustrating, especially when devices refuse to connect or work properly.
              </p>
              <p>
                Developed through a comprehensive research study, PERIFIX bridges the gap between complex technical solutions and everyday users who need simple, clear guidance.
              </p>
              <p>
                Our approach categorizes devices by Input and Output, ensuring that every troubleshooting guide is based on real user experiences, validated by IT professionals, and presented in an easy-to-understand format with visual icons.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Purpose */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mission */}
          <Card className="p-8 text-center bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4">Our Mission</h3>
            <p className="text-muted-foreground">
              To empower non-technical users with clear, visual troubleshooting guides that enable them to independently resolve peripheral connectivity issues without relying on IT support.
            </p>
          </Card>

          {/* Vision */}
          <Card className="p-8 text-center bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4">Our Vision</h3>
            <p className="text-muted-foreground">
              To become the go-to resource for peripheral device troubleshooting, reducing downtime and frustration while building user confidence in managing their own technical issues.
            </p>
          </Card>

          {/* Purpose */}
          <Card className="p-8 text-center bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4">Project Purpose</h3>
            <p className="text-muted-foreground">
              Developed as a research-based solution to address the common challenges faced by users when dealing with peripheral device connectivity, validated through real-world testing and IT expert feedback.
            </p>
          </Card>
        </div>
      </section>

      {/* Research Approach */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="bg-white rounded-3xl p-12 shadow-lg">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="mb-4">Our Research-Based Approach</h2>
            <p className="text-lg text-muted-foreground">
              PERIFIX was developed using a rigorous research methodology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-2xl text-white">1</span>
              </div>
              <h3 className="mb-3">Descriptive Research</h3>
              <p className="text-muted-foreground">
                We gathered data on common peripheral issues, user difficulties, and technician feedback to identify the most prevalent problems.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-2xl text-white">2</span>
              </div>
              <h3 className="mb-3">Developmental Research</h3>
              <p className="text-muted-foreground">
                We created and iteratively refined troubleshooting guides based on user testing, feedback, and validation from IT professionals.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-2xl text-white">3</span>
              </div>
              <h3 className="mb-3">Comparative Research</h3>
              <p className="text-muted-foreground">
                We evaluated different troubleshooting approaches to identify the most effective methods for non-technical users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-12 text-white shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl mb-2 text-amber-300">9</div>
              <p className="text-blue-100">Devices Supported</p>
            </div>
            <div>
              <div className="text-4xl mb-2 text-amber-300">50+</div>
              <p className="text-blue-100">Troubleshooting Steps</p>
            </div>
            <div>
              <div className="text-4xl mb-2 text-amber-300">100%</div>
              <p className="text-blue-100">Research-Based</p>
            </div>
            <div>
              <div className="text-4xl mb-2 text-amber-300">24/7</div>
              <p className="text-blue-100">Available Online</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}