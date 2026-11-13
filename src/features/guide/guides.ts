import type { TourStep } from "./Tour";

/** Student home: goals, to-dos, what the counselor shares, mock interview, menu. */
export const STUDENT_HOME_GUIDE: TourStep[] = [
  {
    zh: { title: "欢迎来到 DreamPlanner", body: "这里是你的升学规划主页：每个季度的目标、要做的事、顾问给你的规划资料都在这一页。花 30 秒看看各部分怎么用。" },
    en: { title: "Welcome to DreamPlanner", body: "This is your planning home: your goals for the quarter, your to-dos and everything your counselor shares with you. Here's a 30-second tour." },
  },
  {
    target: "student-progress",
    zh: { title: "本季目标进度", body: "显示当前季度和目标完成情况。目标由你和顾问一起定，完成一项就勾掉一项，进度条会跟着变化。" },
    en: { title: "This quarter's progress", body: "The current quarter and how many of its goals are done. Goals are set with your counselor; tick them off as you finish them." },
  },
  {
    target: "link-counselor",
    zh: { title: "先关联你的顾问", body: "关联后，顾问才能看到你的进度、给你安排任务、分享规划文档。还没关联的话，点「选择我的顾问」。" },
    en: { title: "Link your counselor", body: "Once linked, your counselor can see your progress, give you tasks and share your plan. Click “Choose my counselor”." },
  },
  {
    target: "student-todo",
    zh: { title: "要做的事", body: "顾问布置的任务、你自己添加的待办和本季目标都在这一个列表里，有截止日期的按日期排在前面。完成后点左边的圆圈打勾。\n顾问布置的任务如果需要延期，点任务旁的「申请延期」，顾问同意后日期会自动更新。" },
    en: { title: "To do", body: "Tasks from your counselor, your own to-dos and this quarter's goals in one list, dated items first. Tick the circle when one is done.\nNeed more time on a counselor's task? Use “Ask for more time”; the date updates once they agree." },
  },
  {
    target: "student-add",
    zh: { title: "添加待办或目标", body: "输入内容、选好日期，点「+」添加。下方可以切换添加为「待办」还是「本季目标」。" },
    en: { title: "Add a to-do or goal", body: "Type it, pick a date and press +. Switch below between adding a to-do and a goal for this quarter." },
  },
  {
    target: "student-shared",
    zh: { title: "顾问分享给我的", body: "规划方案、会议纪要、规划报告和共享文件夹都会出现在这里，点开就能查看或下载。" },
    en: { title: "From your counselor", body: "Your plan, meeting notes, planning reports and shared folder appear here. Open one to read or download it." },
  },
  {
    target: "mock-interview-button",
    zh: { title: "模拟面试", body: "按学校的真实面试形式练习录像面试：系统会读题、计时、录像，练完可以回看自己的回答。会在新标签页打开。" },
    en: { title: "Mock interview", body: "Practise video interviews the way each school runs them: questions are read out, timed and recorded, and you can watch yourself back. Opens in a new tab." },
  },
  {
    target: "student-menu",
    zh: { title: "更多功能", body: "菜单里可以上传成绩单、填写简历、添加共享文件夹、修改个人资料、切换中英文和退出登录。" },
    en: { title: "More", body: "The menu has report-card upload, your résumé, the shared folder, your profile, language and sign out." },
  },
  {
    target: "guide-button",
    zh: { title: "随时重看指南", body: "以后想再看这份说明，点右上角的「使用指南」就行。" },
    en: { title: "See this again", body: "Click “Guide” at the top any time to replay this tour." },
  },
];

/** Counselor home: invite, what needs attention, the student list. */
export const COUNSELOR_HOME_GUIDE: TourStep[] = [
  {
    zh: { title: "欢迎使用顾问工作台", body: "这一页帮你看清所有学生的状态：谁需要跟进、每位学生在哪个阶段。点任一位学生进入他的规划和跟进页面。" },
    en: { title: "Welcome to your workspace", body: "See every student at a glance: who needs follow-up and where each one is. Click a student to open their plan and follow-up." },
  },
  {
    target: "invite-student",
    zh: { title: "添加学生", body: "两种方式：\n直接创建账号——填学生姓名和用户名，系统生成初始密码，你把登录信息发给学生；学生第一次登录时会被要求完善资料、绑定邮箱。\n发邮件邀请——输入学生邮箱，学生注册后在主页选择你作为顾问。" },
    en: { title: "Add a student", body: "Two ways:\nCreate an account — enter the name and a username, a starting password is generated, and you send the login details; on first login the student completes their profile and adds an email.\nInvite by email — they sign up and pick you as their counselor on their home page." },
  },
  {
    target: "counselor-attention",
    zh: { title: "需要处理", body: "系统自动列出需要你处理的事：逾期的待办、即将到期的待办和规划节点、逾期未上传的成绩单、很久没有更新的学生。红色最紧急。" },
    en: { title: "Needs attention", body: "What needs you now: overdue and upcoming to-dos and milestones, missing report cards, students who've gone quiet. Red is most urgent." },
  },
  {
    target: "counselor-students",
    zh: { title: "我的学生", body: "所有你负责或参与的学生。可以按名字搜索、按年级筛选，卡片颜色区分本科、转学和研究生。点进去查看详情。" },
    en: { title: "My students", body: "Everyone you lead or help with. Search by name, filter by grade; colours mark undergraduate, transfer and graduate. Click to open." },
  },
  {
    target: "counselor-menu",
    zh: { title: "菜单", body: "修改个人资料、切换中英文、退出登录。" },
    en: { title: "Menu", body: "Your profile, language and sign out." },
  },
  {
    target: "guide-button",
    zh: { title: "随时重看指南", body: "每个页面右上角都有「使用指南」，可以随时重看这一页的说明。" },
    en: { title: "See this again", body: "Each page has a “Guide” button at the top to replay its tour." },
  },
];

/** A counselor's view of one student: the four tabs. */
export const COUNSELOR_STUDENT_GUIDE: TourStep[] = [
  {
    target: "student-header",
    zh: { title: "学生信息", body: "学生的类型（本科/转学/研究生）、年级、学校、当前阶段和本季目标进度。点「编辑」修改学生状态和基本信息。" },
    en: { title: "Student details", body: "Track (undergraduate / transfer / graduate), grade, school, current stage and quarter progress. “Edit” changes their status and details." },
  },
  {
    target: "tab-overview",
    zh: { title: "概览", body: "本季目标、未来两周要到期的事、成绩概况、负责团队和最近的模拟面试记录，一页看完学生现状。" },
    en: { title: "Overview", body: "Quarter goals, what's due in the next two weeks, grades, the team and recent mock interviews — the student at a glance." },
  },
  {
    target: "tab-plan",
    zh: { title: "规划", body: "按阶段和季度做规划：设定季度目标、上传规划方案（AI 可以把方案拆成季度目标）、关键日期和规划报告。未完成的目标可以顺延到下个季度。" },
    en: { title: "Plan", body: "Plan by stage and quarter: goals, plan documents (AI can turn a plan into quarter goals), key dates and reports. Unfinished goals can carry over." },
  },
  {
    target: "tab-follow",
    zh: { title: "跟进", body: "给学生布置任务（可设截止日期、改期、处理延期申请）、记录每次会议纪要，以及只有顾问能看的备注。" },
    en: { title: "Follow-up", body: "Give tasks (due dates, rescheduling, extension requests), log each meeting, and keep counselor-only notes." },
  },
  {
    target: "tab-schools",
    zh: { title: "选校单", body: "点「从资料生成」，AI 会从规划文档、规划报告和会议纪要里整理出目标学校，你确认后加入；再点「生成待办」，按截止日期倒推生成学生和顾问的待办。" },
    en: { title: "School list", body: "“Draft from notes” builds the list from planning documents, reports and meeting notes for you to confirm; “Draft to-dos” plans the work back from each deadline." },
  },
  {
    target: "tab-application",
    zh: { title: "申请信息", body: "学生填写的网申信息（个人、家庭、学校、成绩、考试、推荐人）。逐个板块核对，并可按申请系统导出给 AI 填表。" },
    en: { title: "Application info", body: "What the student filled in for application forms. Check each section and export it per application system." },
  },
  {
    target: "tab-materials",
    zh: { title: "资料", body: "学生的基本资料、课外活动、共享文件夹、学生自己添加的面试题和简历都在这里。" },
    en: { title: "Materials", body: "Profile, activities, the shared folder, the student's own interview questions and the résumé." },
  },
];

/** Mock interview setup. */
export const MOCK_INTERVIEW_GUIDE: TourStep[] = [
  {
    zh: { title: "模拟面试怎么用", body: "按真实录像面试的形式练习：每道题会先朗读两遍，然后开始准备时间倒计时，倒计时结束自动录像回答。练完可以回看录像。" },
    en: { title: "How mock interviews work", body: "Practise like the real video interviews: each question is read aloud twice, then prep time starts and your answer is recorded. Watch it back afterwards." },
  },
  {
    target: "mi-mode",
    zh: { title: "两种模式", body: "「全真模拟」完全按某所学校的面试形式出题和计时，最接近真实面试。\n「自选练习」可以自己挑题目来源、挑题目、调整时间，适合针对性练习。" },
    en: { title: "Two modes", body: "“Full simulation” follows a school's real format and timing — closest to the real thing.\n“Practice” lets you choose where questions come from, which ones, and the timing." },
  },
  {
    target: "mi-content",
    zh: { title: "选择学校或题目", body: "全真模拟：选择要练的学校和项目，每次随机抽题组成一场面试。\n自选练习：先选题目来源，再选「一道题 / 多选 / 随机」；左边可以设置准备时间、回答时间和计时方式。" },
    en: { title: "Pick a school or questions", body: "Simulation: pick the school and programme; a fresh set is drawn each time.\nPractice: pick a pool, then one, several or random questions; set timing on the left." },
  },
  {
    target: "mi-start",
    zh: { title: "开始", body: "点这里开始。第一次会请求摄像头和麦克风权限，请选择「允许」。面试中途退出的话，这次的录像不会保留。" },
    en: { title: "Start", body: "Start here. The first time, your browser asks for camera and microphone access — choose Allow. Leaving partway discards that run's recordings." },
  },
  {
    target: "guide-button",
    zh: { title: "随时重看指南", body: "想再看这份说明，点「使用指南」。" },
    en: { title: "See this again", body: "Click “Guide” to replay this tour." },
  },
];
