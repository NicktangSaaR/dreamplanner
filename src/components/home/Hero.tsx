
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="max-w-4xl mx-auto text-center">
      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
        Your Future Starts Here
      </span>
      <h1 className="mt-6 text-4xl sm:text-6xl font-bold">
        Weave Your Dreams, Plan for the Future
      </h1>
      <p className="mt-4 text-xl text-muted-foreground">
        Collaborate with counselors, track your progress, and prepare for success
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link to="/signup">
          <Button size="lg" className="text-lg">
            Get Started
          </Button>
        </Link>
        <Link to="/about">
          <Button size="lg" variant="outline" className="text-lg">
            Learn More
          </Button>
        </Link>
      </div>
    </section>
  );
}

