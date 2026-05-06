import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const [email, setEmail] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    Taro.reLaunch({ url: "/pages/login/index" });
  };

  return (
    <View style={{ padding: "40rpx" }}>
      <Text style={{ display: "block", marginBottom: "20rpx" }}>邮箱：{email}</Text>
      <Button onClick={logout}>退出登录</Button>
    </View>
  );
}
