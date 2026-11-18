import { useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMockInterviewAccess } from "./access";
import { useNavigate } from "react-router-dom";
import MainNav from "@/components/layout/MainNav";
import { supabase } from "@/integrations/supabase/client";
import SetupView from "./SetupView";
import InterviewRunner from "./InterviewRunner";
import ReviewView from "./ReviewView";
import LanguageChoice from "./LanguageChoice";
import type { Answer, SessionQuestion, SessionSettings } from "./types";
import { startSession, updateSession, type SessionMeta } from "./sessionLog";

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
  | { name: "interview"; questions: SessionQuestion[]; run: number; meta: SessionMeta }
  | { name: "review"; questions: SessionQuestion[]; answers: Answer[]; meta: SessionMeta };

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const access = useMockInterviewAccess();
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<SessionSettings>(loadSettings);
  const [selection, setSelection] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>({ name: "setup" });
  // The record of the current run (for the student's counselors), if it could be created.
  const sessionId = useRef<Promise<string | null> | null>(null);
  const begin = (questions: SessionQuestion[], meta: SessionMeta) => {
    // Counselors practising (or coaching) aren't students: nothing to log.
    sessionId.current = access.staff ? null : startSession(meta, questions);
    setStage({ name: "interview", questions, run: Date.now(), meta });
  };
  const log = (questions: SessionQuestion[], answers: Answer[], status?: "completed" | "exited") => {
    const pending = sessionId.current;
    if (pending) void pending.then((id) => updateSession(id, questions, answers, status));
  };

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

  if (!userId || access.loading) {
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

  if (!access.allowed) {
    const Z = (zh: string, en: string) => (lang === "zh" ? zh : en);
    return (
      <>
        <MainNav isAuthenticated userId={userId} onLogout={handleLogout} />
        <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 pt-24">
          <div className="max-w-md rounded-lg border bg-card p-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-semibold">{Z("模拟面试暂未开通", "Mock interview isn't turned on for you")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {Z("模拟面试和题库只对开通了这项服务的学员开放。如需使用，请联系你的顾问。", "Mock interviews and the question bank are available to students who have this service. Please contact your counselor if you'd like to use it.")}
            </p>
            <Button className="mt-6" variant="outline" onClick={() => navigate(-1)}>{Z("返回", "Go back")}</Button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
    {stage.name !== "interview" && <MainNav isAuthenticated userId={userId} onLogout={handleLogout} />}
    <LanguageChoice />
    <div className={stage.name === "interview" ? "container mx-auto px-4 py-6" : "container mx-auto px-4 pb-8 pt-24"}>
      {stage.name === "setup" && (
        <SetupView
          userId={userId}
          initialSettings={settings}
          initialSelection={selection}
          staff={access.staff}
          onStart={(questions, s, sel, meta) => {
            setSettings(s);
            setSelection(sel);
            begin(questions, meta);
          }}
        />
      )}
      {stage.name === "interview" && (
        <InterviewRunner
          key={stage.run}
          questions={stage.questions}
          settings={settings}
          onProgress={(answers) => log(stage.questions, answers)}
          onExit={(answers) => {
            log(stage.questions, answers, "exited");
            setStage({ name: "setup" });
          }}
          onFinish={(answers) => {
            log(stage.questions, answers, "completed");
            setStage({ name: "review", questions: stage.questions, answers, meta: stage.meta });
          }}
        />
      )}
      {stage.name === "review" && (
        <ReviewView
          answers={stage.answers}
          settings={settings}
          onAgain={() => {
            discard(stage.answers);
            begin(stage.questions, stage.meta);
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
