import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Mic, Play, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MockInterview = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const startInterview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setIsRecording(true);
      toast({
        title: "Interview Started",
        description: "Your camera and microphone are now active.",
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Error",
        description: "Unable to access camera or microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopInterview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsRecording(false);
      toast({
        title: "Interview Ended",
        description: "Your recording has been stopped.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mock Interview Practice</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Current Question</h2>
          <p className="text-gray-600 mb-6">
            "Tell me about a time when you demonstrated leadership skills in a challenging situation."
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Mic className="w-4 h-4" />
              <span>2 minutes to prepare</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Video className="w-4 h-4" />
              <span>3 minutes to respond</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
            {stream ? (
              <video
                autoPlay
                muted
                playsInline
                className="w-full h-full rounded-lg"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Video className="w-12 h-12 mb-2" />
                <span>Camera preview will appear here</span>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button
                onClick={startInterview}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopInterview}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                Stop Recording
              </Button>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Practice Questions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockQuestions.map((question, index) => (
            <Card key={index} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <h3 className="font-medium mb-2">{question.title}</h3>
              <p className="text-sm text-gray-600">{question.duration} minutes</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const mockQuestions = [
  {
    title: "Describe a project where you had to use analytical skills",
    duration: 3,
  },
  {
    title: "How do you handle working under pressure?",
    duration: 2,
  },
  {
    title: "What are your career goals and aspirations?",
    duration: 3,
  },
  {
    title: "Tell me about a time you failed and what you learned",
    duration: 3,
  },
  {
    title: "How do you prioritize your tasks and manage time?",
    duration: 2,
  },
  {
    title: "Describe a situation where you had to work in a team",
    duration: 3,
  },
];

export default MockInterview;