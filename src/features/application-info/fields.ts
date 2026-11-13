// The application-information form, from the reviewed field catalog.
// Each field says which application systems need it and for which applicants;
// students only see fields for the systems they're applying through.

export type System = "CA" | "CO" | "UC" | "OU" | "BC" | "UK" | "HK" | "SG" | "GR";
export type Applicant = "first_year" | "transfer" | "graduate";
type L2 = { zh: string; en: string };

export const SYSTEMS: { key: System; zh: string; en: string; who: Applicant[] }[] = [
  { key: "CA", zh: "Common App", en: "Common App", who: ["first_year", "transfer"] },
  { key: "CO", zh: "Coalition（Scoir）", en: "Coalition (Scoir)", who: ["first_year", "transfer"] },
  { key: "UC", zh: "UC（加州大学）", en: "University of California", who: ["first_year", "transfer"] },
  { key: "OU", zh: "OUAC（安省）", en: "OUAC (Ontario)", who: ["first_year", "transfer"] },
  { key: "BC", zh: "EducationPlannerBC", en: "EducationPlannerBC", who: ["first_year", "transfer"] },
  { key: "UK", zh: "UCAS（英国）", en: "UCAS (UK)", who: ["first_year", "transfer"] },
  { key: "HK", zh: "香港各校", en: "Hong Kong universities", who: ["first_year", "transfer"] },
  { key: "SG", zh: "新加坡各校", en: "Singapore universities", who: ["first_year", "transfer"] },
  { key: "GR", zh: "硕士申请（各校网申）", en: "Master's (school portals)", who: ["graduate"] },
];
export const APPLICANTS: Record<Applicant, L2> = {
  first_year: { zh: "本科新生", en: "First-year" },
  transfer: { zh: "转学", en: "Transfer" },
  graduate: { zh: "硕士", en: "Master's" },
};

export type Kind = "text" | "longtext" | "date" | "month" | "select" | "number" | "email" | "phone" | "url";
export type Sub = { key: string; zh: string; en: string; kind?: Kind; options?: string[]; placeholder?: string; wide?: boolean };
export type Field = {
  key: string; zh: string; en: string;
  kind: Kind | "address" | "repeat" | "external";
  systems: System[]; who: Applicant[];
  /** 普通 normal · 敏感 sensitive (team only) · 不收集 not collected (student enters it in the application) */
  level: "normal" | "sensitive" | "skip";
  help?: string; options?: string[]; subs?: Sub[]; placeholder?: string;
  /** Only ask when the student's other answers make it relevant. */
  showIf?: (a: Answers) => boolean;
};
export type Section = { key: string; zh: string; en: string; note?: string; fields: Field[] };

const ALL: System[] = ["CA", "CO", "UC", "OU", "BC", "UK", "HK", "SG", "GR"];
const UG: System[] = ["CA", "CO", "UC", "OU", "BC", "UK", "HK", "SG"];
const sys = (s: string) => s.split(" ") as System[];
const WHO: Record<string, Applicant[]> = { F: ["first_year"], T: ["transfer"], G: ["graduate"], FT: ["first_year", "transfer"], FTG: ["first_year", "transfer", "graduate"] };

function f(key: string, zh: string, en: string, kind: Field["kind"], o: Partial<Omit<Field, "who">> & { who?: string } = {}): Field {
  return { key, zh, en, kind, systems: o.systems ?? ALL, who: WHO[o.who ?? "FTG"], level: o.level ?? "normal", help: o.help, options: o.options, subs: o.subs, placeholder: o.placeholder, showIf: o.showIf };
}
const curriculum = (a: Answers) => String(a.schools?.curriculum ?? "");
const studies = (...c: string[]) => (a: Answers) => c.includes(curriculum(a));
const sub = (key: string, zh: string, en: string, o: Partial<Sub> = {}): Sub => ({ key, zh, en, ...o });
const FROM_TO = [sub("from", "开始", "From", { kind: "month" }), sub("to", "结束", "To", { kind: "month" })];

export const SECTIONS: Section[] = [
  {
    key: "personal", zh: "个人信息", en: "Personal details",
    fields: [
      f("legal_first", "法定名（英文/拼音）", "Legal first/given name", "text", { help: "与护照完全一致", placeholder: "Xiaoming" }),
      f("legal_middle", "中间名", "Middle name", "text", { help: "没有就留空" }),
      f("legal_last", "法定姓（英文/拼音）", "Legal last/family name", "text", { help: "与护照完全一致", placeholder: "Wang" }),
      f("name_chinese", "中文姓名", "Name in Chinese characters", "text", { systems: sys("HK SG UK GR") }),
      f("preferred_name", "常用英文名", "Preferred name", "text", { placeholder: "Michael" }),
      f("former_names", "曾用名", "Former legal names", "text", { help: "改过名才填" }),
      f("dob", "出生日期", "Date of birth", "date"),
      f("sex", "法定性别", "Legal sex", "select", { options: ["Female", "Male", "X / Another"], help: "与护照一致" }),
      f("birth_city", "出生城市", "City of birth", "text"),
      f("birth_country", "出生国家/地区", "Country of birth", "text"),
      f("first_language", "第一语言", "First language", "text", { placeholder: "Mandarin" }),
      f("languages", "其他语言", "Other languages", "repeat", {
        subs: [sub("language", "语言", "Language"), sub("level", "熟练程度", "Proficiency", { kind: "select", options: ["Native", "Fluent", "Advanced", "Intermediate", "Basic"] })],
      }),
      f("pronouns", "代词/性别认同", "Pronouns / gender identity", "text", { systems: sys("CA CO"), level: "skip" }),
      f("race_religion", "族裔、宗教等人口信息", "Ethnicity, religion and other demographics", "text", { systems: sys("CA CO UC"), level: "skip" }),
    ],
  },
  {
    key: "contact", zh: "联系方式与地址", en: "Contact and address",
    fields: [
      f("email", "常用邮箱", "Email", "email", { help: "申请期间学校会发很多邮件，建议用一个专门的邮箱" }),
      f("phone", "手机号（含国家代码）", "Mobile phone", "phone", { placeholder: "+1 604 555 0123" }),
      f("phone_alt", "备用电话", "Alternate phone", "phone"),
      f("address", "家庭住址（英文格式）", "Permanent home address", "address"),
      f("mailing_address", "通讯地址（与家庭住址不同时填写）", "Mailing address (if different)", "address"),
      f("address_since", "在当前住址居住起始时间", "Living at this address since", "month", { systems: sys("OU BC UC") }),
    ],
  },
  {
    key: "citizenship", zh: "国籍与居留身份", en: "Citizenship and residency", note: "护照号等证件号码不在这里填写，申请时由你本人填写",
    fields: [
      f("citizenships", "国籍（可多个）", "Citizenship(s)", "repeat", { subs: [sub("country", "国家/地区", "Country")] }),
      f("canada_status", "在加拿大的身份", "Status in Canada", "select", { systems: sys("OU BC UK GR"), level: "sensitive", options: ["Canadian citizen", "Permanent resident", "Study permit", "Other", "Not in Canada"] }),
      f("us_status", "在美国的身份", "Status in the US", "select", { systems: sys("CA CO UC GR"), level: "sensitive", options: ["US citizen", "US permanent resident", "US resident with other status", "Not a US citizen or resident"] }),
      f("uk_residency", "英国居住与学费身份信息", "UK residency and fee status", "longtext", { systems: sys("UK"), level: "sensitive", help: "过去 3 年在哪些国家居住、居住目的，UCAS 用来判断学费类别" }),
      f("hk_right", "香港居留权/签证", "Right of abode / visa for Hong Kong", "select", { systems: sys("HK"), level: "sensitive", options: ["HK permanent resident", "HK resident (non-permanent)", "Requires student visa"] }),
      f("sg_status", "新加坡身份", "Singapore status", "select", { systems: sys("SG"), level: "sensitive", options: ["Citizen", "Permanent resident", "International"] }),
      f("years_in_country", "在当前国家/地区居住年数", "Years lived in current country", "number", { systems: sys("CA CO UC OU BC") }),
      f("years_english_school", "在英语授课学校就读年数", "Years in English-medium schooling", "number", { help: "影响是否需要提交语言成绩" }),
      f("passport_number", "护照号码", "Passport number", "text", { systems: sys("HK SG UK GR"), level: "skip" }),
      f("bc_pen", "BC 个人教育号（PEN）", "BC Personal Education Number", "text", { systems: sys("BC"), showIf: studies("BC Dogwood"), help: "BC 省中学生成绩单上可以找到，9 位数字" }),
      f("ontario_oen", "安省学生号（OEN）", "Ontario Education Number", "text", { systems: sys("OU"), who: "F", showIf: studies("Ontario OSSD"), help: "在安省读过中学才有" }),
    ],
  },
  {
    key: "family", zh: "家庭信息", en: "Family",
    fields: [
      f("household", "父母婚姻状况", "Parents' marital status", "select", { systems: sys("CA CO UC"), who: "FT", options: ["Married", "Living together", "Separated", "Divorced", "Widowed", "Single", "Never married"] }),
      f("lives_with", "主要和谁同住", "Lives with", "text", { systems: sys("CA CO"), who: "FT" }),
      f("parents", "父母/监护人（每人一条）", "Parents / guardians", "repeat", {
        systems: sys("CA CO UC UK HK SG"), who: "FT",
        subs: [
          sub("relationship", "关系", "Relationship", { kind: "select", options: ["Mother", "Father", "Legal guardian", "Stepmother", "Stepfather", "Other"] }),
          sub("name", "姓名（英文）", "Name"), sub("living", "是否在世", "Living", { kind: "select", options: ["Yes", "No"] }),
          sub("email", "邮箱", "Email", { kind: "email" }), sub("phone", "电话", "Phone", { kind: "phone" }),
          sub("occupation", "职业", "Occupation"), sub("employer", "雇主", "Employer"), sub("title", "职位", "Job title"),
          sub("education", "最高学历", "Highest education", { kind: "select", options: ["None", "Primary", "Secondary", "Some college", "Associate", "Bachelor's", "Master's", "Doctorate"] }),
          sub("schools", "毕业院校及学位", "Schools and degrees", { wide: true, placeholder: "Peking University, BA Economics, 1998" }),
        ],
      }),
      f("first_gen", "是否第一代大学生", "First-generation student", "select", { systems: sys("CA CO UC UK"), who: "FT", options: ["Yes", "No"] }),
      f("siblings", "兄弟姐妹", "Siblings", "repeat", {
        systems: sys("CA CO"), who: "FT",
        subs: [sub("name", "姓名", "Name"), sub("age", "年龄", "Age", { kind: "number" }), sub("relationship", "关系", "Relationship"), sub("education", "年级/学历", "Grade / education"), sub("school", "就读院校", "School")],
      }),
      f("legacy", "家人是否就读/任职于所申请学校", "Family ties to colleges you're applying to", "longtext", { systems: sys("CA CO"), who: "FT", placeholder: "例：父亲 1998 年毕业于 Cornell" }),
      f("family_income", "家庭收入与资产", "Family income and assets", "text", { systems: sys("CA CO UC"), who: "FT", level: "skip" }),
    ],
  },
  {
    key: "schools", zh: "中学教育经历", en: "Secondary education",
    fields: [
      f("current_school", "当前/最后就读中学", "Current or most recent secondary school", "text", { help: "学校全称、城市、国家" }),
      f("school_code", "学校代码（CEEB / ACT，美加学校）", "School code (CEEB / ACT)", "text", { systems: sys("CA CO UC") }),
      f("school_entry", "入学时间", "Date of entry", "month"),
      f("grad_date", "毕业/预计毕业时间", "Graduation date", "month"),
      f("curriculum", "课程体系", "Curriculum", "select", { options: ["BC Dogwood", "Ontario OSSD", "Other Canadian province", "US High School", "IB Diploma", "A-Level", "AP-based", "Chinese national curriculum", "Other"] }),
      f("school_type", "学校类型", "School type", "select", { systems: sys("CA CO UC"), options: ["Public", "Private", "Charter", "Homeschool", "Other"] }),
      f("counselor", "学校升学顾问", "School counselor", "repeat", {
        subs: [sub("name", "姓名", "Name"), sub("title", "职位", "Title"), sub("email", "邮箱", "Email", { kind: "email" }), sub("phone", "电话", "Phone", { kind: "phone" })],
        help: "推荐信和成绩单由他/她提交",
      }),
      f("other_schools", "其他就读过的中学", "Other secondary schools", "repeat", {
        subs: [sub("name", "校名", "School"), sub("place", "城市、国家", "City, country"), ...FROM_TO, sub("reason", "转学原因", "Reason for leaving", { wide: true })],
      }),
      f("gap", "学业中断或延迟毕业说明", "Gaps or changes in education", "longtext", { help: "没有就留空" }),
      f("college_courses_hs", "高中期间修过的大学课程", "College courses taken in high school", "repeat", {
        systems: sys("CA CO UC"), who: "F",
        subs: [sub("course", "课程", "Course"), sub("institution", "大学", "Institution"), sub("term", "学期", "Term"), sub("grade", "成绩", "Grade"), sub("credits", "学分", "Credits")],
      }),
    ],
  },
  {
    key: "grades", zh: "成绩与课程", en: "Grades and courses",
    fields: [
      f("gpa", "GPA 及计分制", "GPA and scale", "text", { who: "FT", placeholder: "3.92 / 4.0 unweighted; 4.35 / 5.0 weighted" }),
      f("rank", "年级排名", "Class rank", "text", { who: "FT", placeholder: "12 / 350，或「学校不排名」" }),
      f("class_size", "年级人数", "Graduating class size", "number", { systems: sys("CA CO UC"), who: "FT" }),
      f("transcript", "各学年课程与成绩", "Courses and grades by year", "repeat", {
        who: "FT", help: "按成绩单逐门录入。UC 和部分 Common App 学校要求逐门自报",
        subs: [
          sub("year", "年级", "Grade", { kind: "select", options: ["9", "10", "11", "12"] }), sub("course", "课程名", "Course"),
          sub("level", "级别", "Level", { kind: "select", options: ["Regular", "Honors", "AP", "IB HL", "IB SL", "A-Level", "Dual credit", "Other"] }),
          sub("t1", "第一学期", "Term 1"), sub("t2", "第二学期", "Term 2"), sub("final", "最终成绩", "Final"),
        ],
      }),
      f("current_courses", "本学年在读课程", "Current-year courses", "repeat", {
        who: "FT", subs: [sub("course", "课程名", "Course"), sub("level", "级别", "Level", { kind: "select", options: ["Regular", "Honors", "AP", "IB HL", "IB SL", "A-Level", "Dual credit", "Other"] }), sub("term", "学期", "Term")],
      }),
      f("predicted", "预估成绩", "Predicted grades", "repeat", {
        systems: sys("UK HK SG"), who: "FT", showIf: studies("IB Diploma", "A-Level"), help: "A-Level / IB 由学校给出的预估分",
        subs: [sub("qualification", "考试体系", "Qualification"), sub("subject", "科目", "Subject"), sub("grade", "预估分", "Predicted")],
      }),
      f("bc_grades", "BC 11/12 年级课程成绩", "BC Grade 11/12 courses and marks", "repeat", {
        systems: sys("BC OU"), who: "FT", showIf: studies("BC Dogwood"),
        subs: [sub("course", "课程", "Course"), sub("grade_level", "年级", "Grade", { kind: "select", options: ["11", "12"] }), sub("mark", "分数（%）", "Mark (%)", { kind: "number" }), sub("status", "状态", "Status", { kind: "select", options: ["Completed", "In progress", "Planned"] })],
      }),
    ],
  },
  {
    key: "testing", zh: "标化与语言考试", en: "Tests",
    fields: [
      f("sat_act", "SAT / ACT", "SAT / ACT", "repeat", {
        systems: sys("CA CO HK SG"), who: "FT",
        subs: [sub("test", "考试", "Test", { kind: "select", options: ["SAT", "ACT"] }), sub("date", "日期", "Date", { kind: "date" }), sub("total", "总分", "Total"), sub("sections", "各部分", "Sections", { placeholder: "R&W 720, Math 790" }), sub("status", "状态", "Status", { kind: "select", options: ["Taken", "Planned"] })],
      }),
      f("ap", "AP 考试", "AP exams", "repeat", {
        systems: sys("CA CO UC UK HK SG OU BC"), who: "FT",
        subs: [sub("subject", "科目", "Subject"), sub("year", "年份", "Year", { kind: "number" }), sub("score", "分数", "Score", { kind: "select", options: ["5", "4", "3", "2", "1", "Planned"] })],
      }),
      f("ib", "IB 成绩/预估分", "IB scores", "repeat", {
        systems: sys("CA CO UC UK HK SG OU BC"), who: "FT", showIf: studies("IB Diploma"),
        subs: [sub("subject", "科目", "Subject"), sub("level", "HL/SL", "Level", { kind: "select", options: ["HL", "SL"] }), sub("predicted", "预估", "Predicted"), sub("final", "最终", "Final")],
      }),
      f("alevel", "A-Level / IGCSE", "A-Level / IGCSE", "repeat", {
        systems: sys("CA UC UK HK SG OU BC"), who: "FT", showIf: studies("A-Level"),
        subs: [sub("qualification", "类型", "Type", { kind: "select", options: ["A-Level", "AS", "IGCSE", "GCSE"] }), sub("subject", "科目", "Subject"), sub("board", "考试局", "Board"), sub("predicted", "预估", "Predicted"), sub("final", "最终", "Final")],
      }),
      f("english_test", "语言考试", "English tests", "repeat", {
        subs: [sub("test", "考试", "Test", { kind: "select", options: ["TOEFL iBT", "IELTS Academic", "Duolingo", "PTE Academic", "Cambridge", "Other"] }), sub("date", "日期", "Date", { kind: "date" }), sub("total", "总分", "Total"), sub("sections", "各部分", "Sections", { placeholder: "R 29 / L 28 / S 25 / W 27" }), sub("reg", "考生号", "Registration no.")],
      }),
      f("gre_gmat", "GRE / GMAT", "GRE / GMAT", "repeat", {
        systems: sys("GR"), who: "G",
        subs: [sub("test", "考试", "Test", { kind: "select", options: ["GRE", "GMAT", "GMAT Focus"] }), sub("date", "日期", "Date", { kind: "date" }), sub("total", "总分", "Total"), sub("sections", "各部分", "Sections")],
      }),
      f("other_tests", "其他考试", "Other tests", "repeat", {
        help: "例：LNAT、TMUA、UCAT、ESAT",
        subs: [sub("test", "考试", "Test"), sub("date", "日期", "Date", { kind: "date" }), sub("score", "成绩", "Score")],
      }),
    ],
  },
  {
    key: "activities", zh: "活动与经历", en: "Activities and experiences", note: "活动、奖项、科研、实习都在「活动档案」里填写和更新，这里自动带入",
    fields: [f("from_portfolio", "活动档案", "Activity portfolio", "external")],
  },
  {
    key: "recommenders", zh: "推荐人", en: "Recommenders",
    fields: [
      f("recommenders", "推荐人", "Recommenders", "repeat", {
        subs: [
          sub("name", "姓名", "Name"), sub("title", "职位", "Title"), sub("institution", "学校/机构", "School / organization"),
          sub("relationship", "与你的关系", "Relationship"), sub("email", "邮箱", "Email", { kind: "email" }), sub("phone", "电话", "Phone", { kind: "phone" }),
          sub("context", "教过哪门课/认识多久", "Subject taught / how long known", { wide: true }),
        ],
      }),
      f("ferpa", "是否放弃查看推荐信的权利（FERPA）", "FERPA waiver", "select", { systems: sys("CA CO"), who: "FT", options: ["Waive", "Do not waive"], help: "通常建议放弃" }),
    ],
  },
  {
    key: "choices", zh: "申请学校与专业", en: "Programmes and choices",
    fields: [
      f("intended_major", "意向专业（第一、第二志愿）", "Intended majors", "text", { placeholder: "Economics; Computer Science" }),
      f("career_interest", "职业兴趣", "Career interest", "text", { systems: sys("CA CO"), who: "FT" }),
      f("highest_degree", "计划攻读的最高学位", "Highest degree you plan to earn", "select", { systems: sys("CA CO"), who: "FT", options: ["Bachelor's", "Master's", "Doctorate", "Professional (MD/JD)", "Undecided"] }),
      f("entry_term", "入学学期", "Entry term", "text", { placeholder: "Fall 2027" }),
      f("ucas_choices", "UCAS 志愿（最多 5 个，牛剑只能选一所）", "UCAS choices (up to 5)", "repeat", {
        systems: sys("UK"), subs: [sub("university", "大学", "University"), sub("course", "课程", "Course"), sub("code", "课程代码", "Course code"), sub("campus", "校区", "Campus")],
      }),
      f("ouac_choices", "OUAC 志愿", "OUAC choices", "repeat", { systems: sys("OU"), subs: [sub("university", "大学", "University"), sub("program", "专业", "Programme"), sub("code", "代码", "Code")] }),
      f("bc_choices", "EducationPlannerBC 志愿", "EducationPlannerBC choices", "repeat", { systems: sys("BC"), subs: [sub("institution", "学校", "Institution"), sub("program", "专业", "Programme"), sub("campus", "校区", "Campus")] }),
      f("hk_choices", "香港各校志愿", "Hong Kong choices", "repeat", { systems: sys("HK"), help: "各校分别网申，每校志愿数不同", subs: [sub("university", "大学", "University"), sub("programme", "课程", "Programme"), sub("rank", "志愿顺序", "Rank", { kind: "number" })] }),
      f("sg_choices", "新加坡各校志愿", "Singapore choices", "repeat", { systems: sys("SG"), help: "NUS、NTU、SMU 分别网申", subs: [sub("university", "大学", "University"), sub("programme", "课程", "Programme"), sub("rank", "志愿顺序", "Rank", { kind: "number" })] }),
      f("scholarship", "是否申请奖学金/助学金", "Applying for scholarships or financial aid", "select", { options: ["Yes", "No"] }),
    ],
  },
  {
    key: "transfer", zh: "转学信息", en: "Transfer details",
    fields: [
      f("colleges_attended", "就读过的大学", "Colleges attended", "repeat", {
        systems: sys("CA UC OU BC UK"), who: "T",
        subs: [sub("name", "校名", "Institution"), sub("place", "城市、国家", "City, country"), ...FROM_TO, sub("major", "专业", "Major"), sub("degree", "是否获得学位", "Degree earned", { kind: "select", options: ["No", "Associate", "Bachelor's", "Other"] })],
      }),
      f("college_gpa", "大学 GPA 及计分制", "College GPA and scale", "text", { systems: sys("CA UC OU BC"), who: "T" }),
      f("college_courses", "大学已修和在读课程", "College courses", "repeat", {
        systems: UG, who: "T", help: "UC 要求逐门录入",
        subs: [sub("term", "学期", "Term"), sub("code", "课程代码", "Code"), sub("title", "课程名", "Title"), sub("credits", "学分", "Credits"), sub("grade", "成绩", "Grade")],
      }),
      f("credits", "已获得学分", "Credits completed", "number", { systems: UG, who: "T" }),
      f("transfer_reason", "转学原因", "Reason for transferring", "longtext", { systems: UG, who: "T" }),
      f("academic_standing", "学业状态", "Academic standing", "select", { systems: UG, who: "T", level: "sensitive", options: ["Good standing", "Probation", "Other"] }),
      f("igetc", "UC 转学课程要求完成情况（IGETC / 7 门核心课）", "UC transfer requirements (IGETC / 7-course pattern)", "longtext", { systems: sys("UC"), who: "T" }),
    ],
  },
  {
    key: "graduate", zh: "硕士申请信息", en: "Master's details",
    fields: [
      f("degrees", "本科及以上学历", "Degrees", "repeat", {
        systems: sys("GR"), who: "G",
        subs: [sub("institution", "学校", "Institution"), sub("degree", "学位", "Degree"), sub("major", "专业", "Major"), ...FROM_TO, sub("gpa", "GPA 及计分制", "GPA / scale"), sub("rank", "排名", "Rank"), sub("thesis", "毕业论文题目", "Thesis title", { wide: true })],
      }),
      f("programmes", "申请项目", "Programmes", "repeat", {
        systems: sys("GR"), who: "G",
        subs: [sub("school", "学校", "School"), sub("programme", "项目", "Programme"), sub("concentration", "方向", "Concentration"), sub("entry", "入学学期", "Entry term")],
      }),
      f("certifications", "专业资格证书", "Professional certifications", "repeat", {
        systems: sys("GR"), who: "G", subs: [sub("name", "证书", "Certificate"), sub("issuer", "颁发机构", "Issuer"), sub("date", "日期", "Date", { kind: "month" })],
      }),
      f("funding", "资金来源", "Source of funding", "select", { systems: sys("GR"), who: "G", options: ["Self / family", "Scholarship", "Employer", "Loan", "Other"] }),
      f("portfolio_link", "作品集或个人网站链接", "Portfolio or website", "url", { systems: sys("GR"), who: "G" }),
    ],
  },
  {
    key: "declarations", zh: "其他问题", en: "Other questions",
    fields: [
      f("discipline", "纪律处分记录", "Disciplinary history", "longtext", { systems: sys("CA CO UK GR"), level: "sensitive", help: "只有部分学校会问。如实填写，顾问会帮你措辞；没有就留空" }),
      f("criminal", "刑事记录", "Criminal history", "text", { systems: sys("CA CO UK GR"), level: "skip" }),
      f("disability", "残障或学习支持需求", "Disability or learning support", "text", { level: "skip" }),
      f("fee_waiver", "是否符合申请费减免条件", "Fee waiver eligibility", "select", { systems: sys("CA CO UC"), who: "FT", options: ["Yes", "No", "Not sure"] }),
      f("how_heard", "从哪里了解到该校/项目", "How you heard about the school", "text", { systems: sys("HK SG GR") }),
    ],
  },
];

/**
 * Fields this applicant needs. With systems chosen: what those systems ask
 * for. With none chosen yet: only what every system for this kind of
 * applicant asks for. Fields that depend on other answers (e.g. the
 * curriculum) appear once those answers make them relevant.
 */
export function visibleFields(section: Section, systems: System[], who: Applicant, answers: Answers = {}) {
  const offered = SYSTEMS.filter((s) => s.who.includes(who)).map((s) => s.key);
  const wanted = (fl: Field) => (systems.length ? fl.systems.some((s) => systems.includes(s)) : offered.every((s) => fl.systems.includes(s)));
  return section.fields.filter((fl) => fl.who.includes(who) && wanted(fl) && (!fl.showIf || fl.showIf(answers)));
}
export function visibleSections(systems: System[], who: Applicant, answers: Answers = {}) {
  return SECTIONS.map((s) => ({ ...s, fields: visibleFields(s, systems, who, answers) })).filter((s) => s.fields.length > 0);
}

export type Answers = Record<string, Record<string, unknown>>;
export type Address = { line1?: string; line2?: string; city?: string; region?: string; postal?: string; country?: string };

export function isFilled(field: Field, v: unknown): boolean {
  if (field.kind === "repeat") return Array.isArray(v) && v.some((row) => row && Object.values(row as object).some((x) => String(x ?? "").trim()));
  if (field.kind === "address") {
    const a = (v ?? {}) as Address;
    return !!(a.line1?.trim() && a.city?.trim() && a.country?.trim());
  }
  return String(v ?? "").trim() !== "";
}

/** Fields that count toward completion: things the student fills in here, excluding optional "if any" ones. */
const OPTIONAL = new Set(["legal_middle", "former_names", "phone_alt", "mailing_address", "languages", "other_schools", "gap", "college_courses_hs", "legacy", "siblings", "discipline", "other_tests", "current_courses", "school_code", "certifications", "portfolio_link"]);
export const countsToward = (fl: Field) => fl.level !== "skip" && fl.kind !== "external" && !OPTIONAL.has(fl.key);

export function progress(sections: Section[], answers: Answers) {
  let done = 0, total = 0;
  const per: Record<string, { done: number; total: number }> = {};
  for (const s of sections) {
    let d = 0, t = 0;
    for (const fl of s.fields) {
      if (!countsToward(fl)) continue;
      t++;
      if (isFilled(fl, answers[s.key]?.[fl.key])) d++;
    }
    per[s.key] = { done: d, total: t };
    done += d;
    total += t;
  }
  return { done, total, per };
}

/** Light checks with messages the student can act on. */
export function problem(kind: Kind | undefined, v: string, lang: "zh" | "en"): string | null {
  const s = v.trim();
  if (!s) return null;
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return L("邮箱格式不对", "Check the email address");
  if (kind === "phone" && (!/^\+?[\d\s().-]{7,25}$/.test(s) || s.replace(/\D/g, "").length < 8)) return L("请填数字，并带国家代码，如 +1 604 555 0123", "Use digits with the country code");
  if (kind === "url" && !/^https?:\/\//i.test(s)) return L("链接要以 https:// 开头", "Links start with https://");
  if (kind === "number" && Number.isNaN(Number(s))) return L("请填数字", "Enter a number");
  if (kind === "text" && /[一-鿿]/.test(s)) return null; // Chinese is fine in free text
  return null;
}
