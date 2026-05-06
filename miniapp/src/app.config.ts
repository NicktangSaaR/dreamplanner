export default {
  pages: [
    "pages/login/index",
    "pages/todo/index",
    "pages/profile/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "DreamPlanner",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    color: "#999",
    selectedColor: "#3B82F6",
    backgroundColor: "#fff",
    list: [
      { pagePath: "pages/todo/index", text: "待办" },
      { pagePath: "pages/profile/index", text: "我的" },
    ],
  },
};
