import { View, Button, Input, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { loginWithWechat, bindWechatToEmail } from "../../lib/supabase";

export default function Login() {
  const [needsBinding, setNeedsBinding] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWechatLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithWechat();
      if (result.status === "needs_binding") {
        setNeedsBinding(true);
      } else {
        Taro.reLaunch({ url: "/pages/todo/index" });
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message ?? "登录失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handleBind = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await bindWechatToEmail(email);
      Taro.reLaunch({ url: "/pages/todo/index" });
    } catch (e: any) {
      Taro.showToast({ title: e.message ?? "绑定失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: "60rpx" }}>
      <Text style={{ fontSize: "48rpx", fontWeight: 600, display: "block", marginBottom: "60rpx" }}>
        DreamPlanner
      </Text>
      {!needsBinding ? (
        <Button type="primary" loading={loading} onClick={handleWechatLogin}>
          微信一键登录
        </Button>
      ) : (
        <View>
          <Text style={{ display: "block", marginBottom: "20rpx" }}>
            请输入网站注册邮箱完成绑定
          </Text>
          <Input
            type="text"
            value={email}
            onInput={(e) => setEmail(e.detail.value)}
            placeholder="email@example.com"
            style={{
              border: "1px solid #ddd",
              padding: "20rpx",
              borderRadius: "8rpx",
              marginBottom: "20rpx",
            }}
          />
          <Button type="primary" loading={loading} onClick={handleBind}>
            绑定并登录
          </Button>
        </View>
      )}
    </View>
  );
}
