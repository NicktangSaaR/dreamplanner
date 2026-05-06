# DreamPlanner 微信小程序

基于 Taro 4 + React 的小程序，与网站共享同一个 Supabase 后端。

## 开发流程

```bash
cd miniapp
npm install
npm run dev:weapp
```

然后在「微信开发者工具」打开 `miniapp/dist` 目录预览。

## 必备配置

1. **微信公众平台** ([mp.weixin.qq.com](https://mp.weixin.qq.com))
   - 注册小程序，拿到 **AppID** 和 **AppSecret**
   - 在「订阅消息」里申请「待办到期提醒」模板（建议字段：thing1=待办标题、time2=到期时间、thing3=提醒说明），拿到 **template_id**
   - 在「开发设置 → 服务器域名 → request 合法域名」加上 `https://fyxnuhqzgkzfuldqurej.supabase.co`

2. **Lovable 项目 secrets**（让 Edge Function 能调微信 API）
   - `WECHAT_MINIAPP_APPID`
   - `WECHAT_MINIAPP_SECRET`
   - `WECHAT_TEMPLATE_TODO_DUE` = 上面申请到的模板 ID

3. **代码里替换**
   - `miniapp/src/pages/todo/index.tsx` 顶部 `TODO_TEMPLATE_ID`

## 定时推送

在 Supabase SQL Editor 执行（每天上午 9 点扫一次到期 to-do）：

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

## 架构

| 端 | 技术 | 部署 |
|---|---|---|
| 网站 | React + Vite | Lovable / dreamplanner.lovable.app |
| 小程序 | Taro 4 + React | 本地构建 → 微信开发者工具上传 |
| 后端 | Supabase（共用） | Edge Functions + Postgres |

## 推送链路

1. 用户进入 To-do 页 → 点击「开启到期提醒」→ `wx.requestSubscribeMessage` 授权
2. 前端调 `wechat-record-subscribe` 把配额 +1 写到 `wechat_subscribe_authorizations`
3. 每天 9 点 cron 调 `wechat-todo-cron` → 扫 24h 内到期的未完成 to-do
4. 对每个有微信绑定 + 有配额的 to-do，调 `wechat-send-subscribe` 发送订阅消息，配额 -1
