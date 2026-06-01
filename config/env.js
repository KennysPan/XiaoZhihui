// config/env.js
// 开发环境配置
const dev = {
  API_BASE_URL: 'https://dev-api.yourschool.com',
};

// 生产环境配置
const prod = {
  API_BASE_URL: 'https://api.yourschool.com',
};

// 根据编译环境选择配置（可在 project.config.json 中设置自定义编译条件）
let envConfig = dev;
// 判断逻辑，例如根据域名或手动开关
// if (process.env.NODE_ENV === 'production') {
//   envConfig = prod;
// }

// 简单示例：使用wx.getAccountInfoSync判断（小程序端）
const accountInfo = wx.getAccountInfoSync();
if (accountInfo.miniProgram.envVersion === 'release') {
  envConfig = prod;
} else if (accountInfo.miniProgram.envVersion === 'trial') {
  // 体验版
  envConfig = dev;
}

export const API_BASE_URL = envConfig.API_BASE_URL;
