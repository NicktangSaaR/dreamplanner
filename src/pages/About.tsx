import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Users,
  ClipboardList,
  Calendar,
  MessageSquare,
  FolderKanban,
} from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/20">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex flex-col items-start">
            <h1 className="text-2xl font-semibold text-primary">EduPath</h1>
            <p className="text-sm text-gray-600">Nexus Student Profile Management System</p>
          </Link>
          <div className="space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="hover:text-primary transition-colors">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-white transition-colors">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-32 pb-16">
        <section className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-12">How to Use EduPath</h1>
          
          <div className="space-y-12">
            {tutorialSections.map((section, index) => (
              <div
                key={section.title}
                className="bg-white rounded-lg p-8 shadow-sm border animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    {section.icon}
                  </div>
                  <h2 className="text-2xl font-semibold">{section.title}</h2>
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">{section.description}</p>
                <div className="space-y-3">
                  {section.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                        {stepIndex + 1}
                      </span>
                      <p className="text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">Ready to start your college planning journey?</p>
            <Link to="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white transition-colors">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

const tutorialSections = [
  {
    title: "Student Registration",
    icon: <GraduationCap className="w-6 h-6 text-primary" />,
    description: "Begin your college planning journey by creating your student account.",
    steps: [
      "Sign up with your email address and create a password",
      "Complete your profile with personal information and academic details",
      "Set your educational goals and interested majors",
      "Connect with your school counselor if you have an invitation",
    ],
  },
  {
    title: "Counselor Connection",
    icon: <Users className="w-6 h-6 text-primary" />,
    description: "Work closely with your counselor to plan and track your college applications.",
    steps: [
      "Accept your counselor's invitation or request to connect with one",
      "Schedule meetings and consultations through the platform",
      "Receive personalized guidance and feedback",
      "Track your progress together through shared dashboards",
    ],
  },
  {
    title: "Academic Planning",
    icon: <ClipboardList className="w-6 h-6 text-primary" />,
    description: "Keep track of your academic progress and plan your course load.",
    steps: [
      "Input your current courses and grades",
      "Plan future course selections",
      "Track your GPA and academic achievements",
      "Identify areas for improvement and set academic goals",
    ],
  },
  {
    title: "College Application Timeline",
    icon: <Calendar className="w-6 h-6 text-primary" />,
    description: "Stay organized with application deadlines and important dates.",
    steps: [
      "Create a personalized application timeline",
      "Set reminders for important deadlines",
      "Track application status for each college",
      "Manage document submissions and requirements",
    ],
  },
  {
    title: "Communication Hub",
    icon: <MessageSquare className="w-6 h-6 text-primary" />,
    description: "Stay connected with your counselor and manage your college planning discussions.",
    steps: [
      "Share notes and updates with your counselor",
      "Discuss college choices and application strategies",
      "Request feedback on essays and applications",
      "Keep all communication organized in one place",
    ],
  },
  {
    title: "Resource Management",
    icon: <FolderKanban className="w-6 h-6 text-primary" />,
    description: "Access and organize all your college planning resources.",
    steps: [
      "Store and organize application materials",
      "Access shared resources from your counselor",
      "Keep track of recommendation letters",
      "Manage college research materials and notes",
    ],
  },
];

export default About;