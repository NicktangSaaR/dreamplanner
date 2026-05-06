import { View, Text, Checkbox, Button } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

// ⚠️ 等你在微信公众平台拿到"待办提醒"模板 ID 后，回填这里就能开启订阅推送
const TODO_TEMPLATE_ID = "";

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

  async function requestSubscribe() {
    if (!TODO_TEMPLATE_ID) {
      Taro.showModal({
        title: "暂未启用",
        content: "请先在公众平台申请订阅消息模板，并把 template_id 配置到代码里",
        showCancel: false,
      });
      return;
    }
    try {
      const res = await Taro.requestSubscribeMessage({ tmplIds: [TODO_TEMPLATE_ID] });
      if (res[TODO_TEMPLATE_ID] === "accept") {
        const { data: { session } } = await supabase.auth.getSession();
        await Taro.request({
          url: `https://fyxnuhqzgkzfuldqurej.supabase.co/functions/v1/wechat-record-subscribe`,
          method: "POST",
          data: { template_ids: [TODO_TEMPLATE_ID] },
          header: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        });
        Taro.showToast({ title: "订阅成功", icon: "success" });
      }
    } catch {
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
