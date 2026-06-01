const dataService = require('./utils/dataService.js');
const MockData = require('./utils/mockData.js');

App({
  onLaunch() {
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    MockData.initMockData();

    const token = wx.getStorageSync('accessToken');
    const agentInfo = wx.getStorageSync('agentInfo');
    if (token && agentInfo) {
      this.globalData.token = token;
      this.globalData.agentInfo = agentInfo;
    }

    if (token && !agentInfo) {
      dataService.getTeacherProfile().then(userInfo => {
        this.globalData.userInfo = userInfo;
      }).catch(() => {});
    }
  },

  setLoginStatus(token, agentInfo) {
    this.globalData.token = token;
    this.globalData.agentInfo = agentInfo;
    wx.setStorageSync('accessToken', token);
    wx.setStorageSync('agentInfo', agentInfo);
  },

  clearLoginStatus() {
    this.globalData.token = null;
    this.globalData.agentInfo = null;
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('agentInfo');
  },

  globalData: {
    userInfo: {},
    token: null,
    agentInfo: null,
    selectedRole: 'teacher'
  }


  
});
