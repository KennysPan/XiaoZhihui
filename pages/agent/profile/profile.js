// pages/agent/profile/profile.js
const Ext = require('../../../utils/Ext');

Page({
  data: {
    agentInfo: null
  },

  onShow() {
    const agentInfo = wx.getStorageSync('agentInfo');
    this.setData({ agentInfo });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Ext.clearToken();
          wx.removeStorageSync('agentInfo');
          const app = getApp();
          app.clearLoginStatus();
          wx.reLaunch({ url: '/pages/agent/login/login' });
        }
      }
    });
  },

  editProfile() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});