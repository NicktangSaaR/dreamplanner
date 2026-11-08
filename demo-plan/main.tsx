import React from "react";
import ReactDOM from "react-dom/client";
import PlanTabPreview from "@/features/counselor/plan/PlanTabPreview";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div style={{ padding: "6px 16px", fontSize: 12, textAlign: "center", background: "hsl(36 40% 94%)", borderBottom: "1px solid hsl(36 30% 85%)" }}>
      预览页面 · 顾问端「规划」页新布局 · 示例数据，所有操作只在这个页面里生效
    </div>
    <PlanTabPreview />
  </React.StrictMode>,
);
