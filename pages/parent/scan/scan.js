const Ext = require('../utils/Ext');

Page({
  data: {
    isScanning: false
  },

  onShow() {
    if (!Ext.isLogin()) {
      wx.reLaunch({ url: '/pages/roleSelect/roleSelect?manual=1' });
      return;
    }

    this.updateTabBarSelected();

    if (!this.data.isScanning) {
      this.startScan();
    }
  },

  updateTabBarSelected() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  startScan() {
    this.setData({ isScanning: true });

    wx.scanCode({
      success: () => {
        wx.showToast({ title: '扫码成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '扫码取消', icon: 'none' });
      },
      complete: () => {
        this.setData({ isScanning: false });
        wx.redirectTo({ url: '/pages/parent/home/home' });
      }
    });
  }
});
