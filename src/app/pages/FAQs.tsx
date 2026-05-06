import { Card } from "../components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { HelpCircle } from "lucide-react";
import logoImage from "../assets/perifix-logo.png";

export function FAQs() {
  const faqs = [
    {
      question: "What is PERIFIX?",
      answer: "PERIFIX is a visual troubleshooting guide designed to help non-ICT users solve common peripheral device connectivity issues. It provides step-by-step instructions with visual aids to make troubleshooting easy and accessible for everyone."
    },
    {
      question: "Which devices does PERIFIX support?",
      answer: "PERIFIX supports 9 common peripheral devices: Keyboard, Mouse, Webcam, USB Drive, LAN Cable (Input Devices), and Monitor, Printer, Speakers, and Projector (Output Devices)."
    },
    {
      question: "How do I use PERIFIX?",
      answer: "Start by clicking 'Start Troubleshooting' on the homepage. Then, select whether your issue is with an Input or Output device. Choose your specific device, select the problem severity (Common, Moderate, or Rare), and follow the step-by-step visual guide provided."
    },
    {
      question: "What's the difference between Input and Output devices?",
      answer: "Input devices send data TO your computer (like keyboards, mice, webcams, USB drives, and LAN cables). Output devices receive data FROM your computer to display or produce results (like monitors, printers, speakers, and projectors)."
    },
    {
      question: "What do Common, Moderate, and Rare problem categories mean?",
      answer: "Common problems are the most frequently encountered issues that affect many users. Moderate problems occur occasionally and may require slightly more technical steps. Rare problems are uncommon issues that happen infrequently but are still addressable."
    },
    {
      question: "Do I need technical knowledge to use PERIFIX?",
      answer: "No! PERIFIX is specifically designed for non-technical users. Each troubleshooting step includes clear instructions and visual aids to guide you through the process without requiring IT expertise."
    },
    {
      question: "What if my problem isn't listed?",
      answer: "If your specific problem isn't listed, try following the steps for the most similar issue. If that doesn't help, use the 'Contact Support' button at the bottom of the Troubleshooting page to get personalized assistance."
    },
    {
      question: "Can I use PERIFIX on mobile devices?",
      answer: "Yes! PERIFIX is fully responsive and works on smartphones, tablets, and desktop computers. You can access troubleshooting guides from any device with an internet connection."
    },
    {
      question: "Is PERIFIX free to use?",
      answer: "Yes, PERIFIX is completely free. It was developed as a research-based educational tool to help users solve peripheral connectivity issues independently."
    },
    {
      question: "How often is PERIFIX updated?",
      answer: "PERIFIX is regularly updated based on user feedback, new device technologies, and emerging common issues. Our troubleshooting guides are continuously refined to provide the most accurate and helpful information."
    },
    {
      question: "What should I do if the troubleshooting steps don't work?",
      answer: "If you've followed all the steps and your device still isn't working, click the 'Contact Support' button on the Troubleshooting page. You can also visit our Contact page to get in touch with our support team for personalized help."
    },
    {
      question: "Can I suggest new features or improvements?",
      answer: "Absolutely! We welcome user feedback. Please visit our Contact page to share your suggestions, report issues, or request support for additional devices."
    }
  ];

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img src={logoImage} alt="PERIFIX Logo" className="w-24 h-24 object-contain" />
          </div>
          <div className="inline-block px-4 py-1 bg-blue-600/10 text-blue-600 rounded-full mb-4">
            Help Center
          </div>
          <h1 className="mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about PERIFIX and troubleshooting
          </p>
        </div>
      </div>

      {/* FAQs Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <Card className="p-8 bg-white shadow-lg">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left hover:text-blue-600">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-8">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>

      {/* Contact CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-center text-white shadow-xl">
          <h2 className="mb-4 text-white">Still Have Questions?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-md"
          >
            Contact Support
          </a>
        </Card>
      </section>
    </div>
  );
}
