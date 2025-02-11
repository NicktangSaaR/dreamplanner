
import { Check, User, Star } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
}

export default function Features() {
  const features: Feature[] = [
    {
      title: "Track Your Progress",
      description: "Keep on eye on your course selction, GPA and excurricular activities.",
      icon: <Check className="h-6 w-6 text-green-500" />,
    },
    {
      title: "Collaborate with Counselors",
      description: "Get guidance and support from experienced counselors.",
      icon: <User className="h-6 w-6 text-blue-500" />,
    },
    {
      title: "AI-Supported School Research",
      description: "Build your AI-supported school list that includes top schools across the world.",
      icon: <Star className="h-6 w-6 text-yellow-500" />,
    },
  ];

  return (
    <section className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="p-6 rounded-2xl bg-white shadow-sm border"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {feature.icon}
          </div>
          <h3 className="text-xl font-semibold">{feature.title}</h3>
          <p className="mt-2 text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </section>
  );
}
