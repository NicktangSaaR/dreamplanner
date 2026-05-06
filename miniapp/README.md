# DreamPlanner 微信小程序

基于 Taro 4 + React，与网站共用同一个 Supabase 后端。

---

## 一、第一次跑起来（5 分钟）

```bash
cd miniapp
npm install          # 装依赖
npm run dev:weapp    # 持续编译，输出到 miniapp/dist
```

打开「**微信开发者工具**」→ 导入项目：
- 项目目录：选 `miniapp/` 这个文件夹（注意：不是 `dist`，工具会按 `project.config.json` 自动指向 `dist`）
- AppID：会自动读取 `wx2cf6175453246d95`
- 不使用云服务

进去后应该能看到：
- 底部 tab：**待办** / **我的**
- 「待办」页：未登录时会跳到登录页
- 「我的」页：显示当前邮箱 + 退出登录

> ⚠️ 第一次启动若提示「不在以下 request 合法域名列表」，在开发者工具右上角「详情 → 本地设置」勾选「**不校验合法域名**」即可（线上发布前必须配置）。

---

## 二、配置公众平台（订阅消息开通流程）

1. 登录 [mp.weixin.qq.com](https://mp.weixin.qq.com)
2. **设置 → 基本设置**：填写小程序名称、头像、简介、**服务类目**（必填，否则订阅消息菜单不会出现）
3. 等左侧菜单出现 **功能 → 订阅消息**，进入 → **公共模板库** → 搜「待办」/「任务」/「提醒」
4. 选一个含以下字段的模板申请：
   - `thing` 类型 — 待办标题
   - `time` 类型 — 到期时间
   - `thing` 类型 — 提醒说明
5. 拿到 **template_id**（一长串字符串）

---

## 三、启用订阅推送（拿到 template_id 之后）

1. 把 template_id 填到 `miniapp/src/pages/todo/index.tsx` 顶部的 `TODO_TEMPLATE_ID`
2. 在 Lovable 的 Supabase secrets 里加上 `WECHAT_TEMPLATE_TODO_DUE` = 同一个 template_id
3. 在「**开发管理 → 开发设置 → 服务器域名 → request 合法域名**」加上：
   `https://fyxnuhqzgkzfuldqurej.supabase.co`
4. 在 Supabase SQL Editor 跑一次：
   ```sql
   select cron.schedule(
     'wechat-todo-daily',
     '0 9 * * *',
     $$ select net.http_post(
          url := 'https://fyxnuhqzgkzfuldqurej.supabase.co/functions/v1/wechat-todo-cron',
          headers := '{"Content-Type":"application/json"}'::jsonb
        ); $$
   );
   ```

---

## 四、当前状态

| 模块 | 状态 |
|---|---|
| 小程序骨架（登录 / 待办 / 我的） | ✅ 已完成 |
| Supabase 客户端（Taro 适配） | ✅ |
| 微信登录 Edge Function | ✅ 待联调 |
| 订阅消息推送 | ⏸ 等公众平台模板审核 |

