import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MainNav from "@/components/layout/MainNav";
import { supabase } from "@/integrations/supabase/client";
import SetupView from "./SetupView";
import InterviewRunner from "./InterviewRunner";
import ReviewView from "./ReviewView";
import type { Answer, SessionQuestion, SessionSettings } from "./types";

const SETTINGS_KEY = "dreamplanner.mockInterview.settings";

function loadSettings(): SessionSettings {
  const fallback: SessionSettings = { school: "", program: "", retakes: 0, shuffle: false };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

type Stage =
  | { name: "setup" }
  | { name: "interview"; questions: SessionQuestion[]; run: number }
  | { name: "review"; questions: SessionQuestion[]; answers: Answer[] };

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SessionSettings>(loadSettings);
  const [selection, setSelection] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>({ name: "setup" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Not persisted; fine for this visit.
    }
  }, [settings]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage.name]);

  const discard = (answers: Answer[]) => answers.forEach((a) => a.videoUrl && URL.revokeObjectURL(a.videoUrl));

  if (!userId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
    {stage.name !== "interview" && <MainNav isAuthenticated userId={userId} onLogout={handleLogout} />}
    <div className={stage.name === "interview" ? "container mx-auto px-4 py-6" : "container mx-auto px-4 pb-8 pt-24"}>
      {stage.name === "setup" && (
        <SetupView
          userId={userId}
          initialSettings={settings}
          initialSelection={selection}
          onStart={(questions, s, sel) => {
            setSettings(s);
            setSelection(sel);
            setStage({ name: "interview", questions, run: Date.now() });
          }}
        />
      )}
      {stage.name === "interview" && (
        <InterviewRunner
          key={stage.run}
          questions={stage.questions}
          settings={settings}
          onExit={() => setStage({ name: "setup" })}
          onFinish={(answers) => setStage({ name: "review", questions: stage.questions, answers })}
        />
      )}
      {stage.name === "review" && (
        <ReviewView
          answers={stage.answers}
          settings={settings}
          onAgain={() => {
            discard(stage.answers);
            setStage({ name: "interview", questions: stage.questions, run: Date.now() });
          }}
          onBackToSetup={() => {
            discard(stage.answers);
            setStage({ name: "setup" });
          }}
        />
      )}
    </div>
    </>
  );
}
