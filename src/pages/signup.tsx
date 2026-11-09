import { useState } from "react";
import { GRAD_DEGREE_LABEL, GRAD_STATUSES, GRAD_STATUS_LABEL } from "@/shared/planning";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * The school year changes in September, when the yearly grade update moves
 * students up a grade. In July and August students pick the grade they just
 * finished; September moves them up automatically.
 */
const NOW = new Date();
const SCHOOL_YEAR_START = NOW.getMonth() >= 8 ? NOW.getFullYear() : NOW.getFullYear() - 1;
const SCHOOL_YEAR = `${SCHOOL_YEAR_START}–${String(SCHOOL_YEAR_START + 1).slice(2)}`;
const ENTRY_YEARS = Array.from({ length: 5 }, (_, i) => NOW.getFullYear() + i);
const IS_SUMMER = NOW.getMonth() === 6 || NOW.getMonth() === 7;

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [majorInput, setMajorInput] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    englishName: "",
    school: "",
    grade: "",
    parentEmail: "",
    interestedMajors: [] as string[],
    isUndecided: false,
    userType: "student" as "student" | "counselor",
    applicantType: "undergrad" as "undergrad" | "graduate",
    gradStatus: "",
    gradDegree: "",
    entryTerm: "fall",
    entryYear: "",
  });

  const handleAddMajor = () => {
    const trimmed = majorInput.trim();
    if (trimmed && !formData.interestedMajors.includes(trimmed)) {
      setFormData({
        ...formData,
        interestedMajors: [...formData.interestedMajors, trimmed],
        isUndecided: false,
      });
      setMajorInput("");
    }
  };

  const handleRemoveMajor = (major: string) => {
    setFormData({
      ...formData,
      interestedMajors: formData.interestedMajors.filter((m) => m !== major),
    });
  };

  const handleToggleUndecided = () => {
    setFormData({
      ...formData,
      isUndecided: !formData.isUndecided,
      interestedMajors: !formData.isUndecided ? [] : formData.interestedMajors,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const isGradSignup = formData.userType === "student" && formData.applicantType === "graduate";
    if (isGradSignup && (!formData.gradStatus || !formData.gradDegree)) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please choose your current status and the degree you are applying for. (请选择目前状态和申请方向)",
      });
      setLoading(false);
      return;
    }

    if (formData.userType === "student" && !isGradSignup && !formData.grade) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please choose your current grade. (请选择当前年级)",
      });
      setLoading(false);
      return;
    }

    // A major typed but not yet added with "Add" still counts.
    const pendingMajor = majorInput.trim();
    const interestedMajors =
      pendingMajor && !formData.interestedMajors.includes(pendingMajor)
        ? [...formData.interestedMajors, pendingMajor]
        : formData.interestedMajors;

    // For students, require majors or undecided
    if (formData.userType === "student" && !formData.isUndecided && interestedMajors.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please add at least one interested major or select Undecided. (请填写至少一个感兴趣的专业，或勾选「未确定」)",
      });
      setLoading(false);
      return;
    }

    try {
      const majors = formData.isUndecided
        ? ["Undecided"]
        : interestedMajors;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.fullName,
            english_name: formData.englishName,
            user_type: formData.userType,
            school: formData.school,
            grade: formData.applicantType === "graduate" ? "" : formData.grade,
            applicant_type: formData.applicantType,
            ...(formData.applicantType === "graduate"
              ? {
                  grad_status: formData.gradStatus,
                  grad_degree: formData.gradDegree,
                  target_entry_term: formData.entryYear ? formData.entryTerm : "",
                  target_entry_year: formData.entryYear,
                }
              : {}),
            parent_email: formData.parentEmail,
            interested_majors: majors.join(","),
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);

        if (error.message.includes("User already registered")) {
          toast({
            variant: "destructive",
            title: "Account Already Exists",
            description: "This email is already registered. Please log in instead.",
          });
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: error.message,
        });
        return;
      }

      console.log("Signup successful:", data);

      if (formData.userType === "counselor") {
        toast({
          title: "Registration Pending",
          description:
            "Your counselor account has been created. Please check your email to verify your account, then wait for admin verification.",
        });
      } else {
        toast({
          title: "Account Created!",
          description:
            "A verification email has been sent. Please check your inbox and verify your email before logging in.",
        });
      }

      navigate("/login");
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isStudent = formData.userType === "student";
  const isGrad = isStudent && formData.applicantType === "graduate";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Link
        to="/"
        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
      >
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Link>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Sign up to get started with DreamPlanner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Type */}
            <div className="space-y-2">
              <Label>I am a</Label>
              <RadioGroup
                value={formData.userType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    userType: value as "student" | "counselor",
                  })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="counselor" id="counselor" />
                  <Label htmlFor="counselor">Counselor</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Undergraduate or graduate applicant */}
            {isStudent && (
              <div className="space-y-2">
                <Label>Applying for (申请类型)<span className="text-destructive"> *</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["undergrad", "graduate"] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setFormData({ ...formData, applicantType: k })}
                      aria-pressed={formData.applicantType === k}
                      className={`rounded-md border px-3 py-2.5 text-left text-sm ${formData.applicantType === k ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50"}`}>
                      {k === "undergrad" ? "Undergraduate (申请本科)" : "Graduate (申请研究生)"}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {k === "undergrad" ? "High school students 高中生" : "Master's / MBA 硕士、MBA"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full Name (Chinese/Real Name) */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name (真名)<span className="text-destructive"> *</span></Label>
              <Input
                id="fullName"
                type="text"
                required
                placeholder="e.g. 张三"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>

            {/* English Name */}
            <div className="space-y-2">
              <Label htmlFor="englishName">English Name (英文名)<span className="text-destructive"> *</span></Label>
              <Input
                id="englishName"
                type="text"
                required
                placeholder="e.g. Sam Zhang"
                value={formData.englishName}
                onChange={(e) =>
                  setFormData({ ...formData, englishName: e.target.value })
                }
              />
            </div>

            {/* School */}
            {isStudent && (
              <div className="space-y-2">
                <Label htmlFor="school">
                  {isGrad ? "University (本科/所在大学)" : "School (所在学校)"}<span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="school"
                  type="text"
                  required
                  placeholder={isGrad ? "e.g. University of British Columbia" : "e.g. Beijing No.4 High School"}
                  value={formData.school}
                  onChange={(e) =>
                    setFormData({ ...formData, school: e.target.value })
                  }
                />
              </div>
            )}

            {/* Graduate applicant details */}
            {isGrad && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gradStatus">Current status (目前状态)<span className="text-destructive"> *</span></Label>
                  <select id="gradStatus" required value={formData.gradStatus}
                    onChange={(e) => setFormData({ ...formData, gradStatus: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">Select... (请选择)</option>
                    {GRAD_STATUSES.map((g) => <option key={g} value={g}>{GRAD_STATUS_LABEL[g].en} ({GRAD_STATUS_LABEL[g].zh})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Applying for (申请方向)<span className="text-destructive"> *</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["masters", "mba"] as const).map((k) => (
                      <button key={k} type="button" onClick={() => setFormData({ ...formData, gradDegree: k })}
                        aria-pressed={formData.gradDegree === k}
                        className={`rounded-md border px-3 py-2 text-sm ${formData.gradDegree === k ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50"}`}>
                        {GRAD_DEGREE_LABEL[k].en} ({GRAD_DEGREE_LABEL[k].zh})
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryYear">Planned start (计划入学时间)</Label>
                  <div className="flex gap-2">
                    <select id="entryYear" value={formData.entryYear}
                      onChange={(e) => setFormData({ ...formData, entryYear: e.target.value })}
                      className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">Not sure yet (还不确定)</option>
                      {ENTRY_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select aria-label="Term" value={formData.entryTerm} disabled={!formData.entryYear}
                      onChange={(e) => setFormData({ ...formData, entryTerm: e.target.value })}
                      className="flex h-10 w-36 rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="fall">Fall (秋季)</option>
                      <option value="spring">Spring (春季)</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your plan is laid out backwards from this date. Not sure? Leave it blank and your counselor will set it.
                    （规划时间轴会以入学时间为终点倒推。不确定可以留空，顾问会帮你设置。）
                  </p>
                </div>
              </div>
            )}

            {/* Grade */}
            {isStudent && !isGrad && (
              <div className="space-y-2">
                <Label htmlFor="grade">
                  Grade in the {SCHOOL_YEAR} school year ({SCHOOL_YEAR} 学年所在年级)<span className="text-destructive"> *</span>
                </Label>
                <select
                  id="grade"
                  required
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({ ...formData, grade: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select grade... (请选择)</option>
                  <option value="G8">G8 or below (八年级及以下)</option>
                  <option value="G9">G9 (九年级)</option>
                  <option value="G10">G10 (十年级)</option>
                  <option value="G11">G11 (十一年级)</option>
                  <option value="G12">G12 (十二年级)</option>
                  <option value="Transfer">University student, applying to transfer (大学在读，申请转学)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose the grade you are in now. Your plan, reminders and the yearly grade update all start from it.
                  （请选择你现在就读的年级。规划阶段、提醒和每年自动升年级都以此为准。）
                </p>
                {IS_SUMMER && (
                  <p className="text-xs text-muted-foreground">
                    It's summer break: choose the grade you just finished. You will move up automatically in September.
                    （现在是暑假：请选择刚读完的年级，9 月会自动升一级。）
                  </p>
                )}
              </div>
            )}

            {/* Student Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {isStudent ? "Student Email (学生邮箱)" : "Email"}<span className="text-destructive"> *</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            {/* Parent Email */}
            {isStudent && (
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Parent Email (家长邮箱) <span className="font-normal text-muted-foreground">· optional 选填</span></Label>
                <Input
                  id="parentEmail"
                  type="email"
                  placeholder="parent@email.com"
                  value={formData.parentEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, parentEmail: e.target.value })
                  }
                />
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password (密码，至少 6 位)<span className="text-destructive"> *</span></Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            {/* Interested Majors */}
            {isStudent && (
              <div className="space-y-2">
                <Label>Interested Majors (感兴趣的专业方向)<span className="text-destructive"> *</span></Label>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isUndecided}
                      onChange={handleToggleUndecided}
                      className="rounded"
                    />
                    Undecided (未确定)
                  </label>
                </div>

                {!formData.isUndecided && (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a major and press Add"
                        value={majorInput}
                        onChange={(e) => setMajorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddMajor();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddMajor}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    {formData.interestedMajors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.interestedMajors.map((major) => (
                          <Badge
                            key={major}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {major}
                            <button
                              type="button"
                              onClick={() => handleRemoveMajor(major)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Required (必填)
            </p>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0"
                onClick={() => navigate("/login")}
              >
                Log in
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
