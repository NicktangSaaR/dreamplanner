import { View, Text, Checkbox, Button } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

// ⚠️ 替换为你在微信公众平台申请的"待办到期提醒"模板 ID
const TODO_TEMPLATE_ID = "REPLACE_WITH_YOUR_TEMPLATE_ID";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);

  useDidShow(() => {
    void loadTodos();
  });

  async function loadTodos() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Taro.reLaunch({ url: "/pages/login/index" });
      return;
    }
    const { data } = await supabase
      .from("todos")
      .select("id,title,completed,due_date")
      .eq("author_id", user.id)
      .order("due_date", { ascending: true });
    setTodos((data ?? []) as Todo[]);
    setLoading(false);
  }

  async function toggle(todo: Todo) {
    await supabase.from("todos").update({ completed: !todo.completed }).eq("id", todo.id);
    void loadTodos();
  }

  // 引导用户授权订阅消息（每授权一次配额 +1）
  async function requestSubscribe() {
    try {
      const res = await Taro.requestSubscribeMessage({ tmplIds: [TODO_TEMPLATE_ID] });
      if (res[TODO_TEMPLATE_ID] === "accept") {
        const { data: { session } } = await supabase.auth.getSession();
        await Taro.request({
          url: `${supabase.supabaseUrl}/functions/v1/wechat-record-subscribe`,
          method: "POST",
          data: { template_ids: [TODO_TEMPLATE_ID] },
          header: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: supabase.supabaseKey,
          },
        });
        Taro.showToast({ title: "订阅成功", icon: "success" });
      }
    } catch (e: any) {
      Taro.showToast({ title: "订阅失败", icon: "none" });
    }
  }

  return (
    <View style={{ padding: "30rpx" }}>
      <Button size="mini" onClick={requestSubscribe} style={{ marginBottom: "30rpx" }}>
        开启到期提醒
      </Button>
      {loading && <Text>加载中…</Text>}
      {todos.map((t) => (
        <View
          key={t.id}
          style={{
            background: "#fff",
            padding: "24rpx",
            borderRadius: "12rpx",
            marginBottom: "16rpx",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Checkbox checked={t.completed} onClick={() => toggle(t)} />
          <View style={{ marginLeft: "20rpx", flex: 1 }}>
            <Text
              style={{
                textDecoration: t.completed ? "line-through" : "none",
                color: t.completed ? "#999" : "#000",
              }}
            >
              {t.title}
            </Text>
            {t.due_date && (
              <Text style={{ display: "block", fontSize: "24rpx", color: "#888" }}>
                {new Date(t.due_date).toLocaleString("zh-CN")}
              </Text>
            )}
          </View>
        </View>
      ))}
      {!loading && todos.length === 0 && (
        <Text style={{ color: "#999" }}>暂无待办</Text>
      )}
    </View>
  );
}
