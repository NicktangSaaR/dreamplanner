const config = {
  projectName: "dreamplanner-miniapp",
  date: "2026-5-6",
  designWidth: 750,
  deviceRatio: { 750: 1 },
  sourceRoot: "src",
  outputRoot: "dist",
  plugins: [],
  framework: "react",
  compiler: "webpack5",
  cache: { enable: false },
  mini: {
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
  h5: {
    publicPath: "/",
    staticDirectory: "static",
  },
};

module.exports = config;
