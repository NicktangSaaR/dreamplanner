import { ClipboardList, MessagesSquare, FileText, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FEATURES: Feature[] = [
  {
    title: "记录成长档案",
    description: "课程、GPA、课外活动和奖项集中在一处，随时更新，随时查看。",
    icon: ClipboardList,
  },
  {
    title: "与顾问协作",
    description: "顾问为你布置待办、记录会议纪要，进度双方都看得见。",
    icon: MessagesSquare,
  },
  {
    title: "生成规划报告与简历",
    description: "根据你的档案生成季度规划报告和活动简历，再由顾问把关修改。",
    icon: FileText,
  },
  {
    title: "模拟面试练习",
    description: "按院校题库录制回答，回看自己的表达，反复练到自然。",
    icon: Video,
  },
];

export default function Features() {
  return (
    <section className="mt-28" aria-labelledby="features-heading">
      <h2 id="features-heading" className="font-serif text-2xl font-semibold text-pine sm:text-3xl">
        学生和顾问需要的，都在这里
      </h2>
      <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ title, description, icon: Icon }) => (
          <div key={title} className="border-t-2 border-primary pt-5">
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-pine">{title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
