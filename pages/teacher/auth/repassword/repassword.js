Page({
  data: {
    phoneNumber: '198****2296',
    fullPhoneNumber: '19831962296',
    statusBarHeight: 20,
    menuButtonTop: 24,
    menuButtonHeight: 32
  },

  onLoad() {
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      menuButtonTop: menuButton.top,
      menuButtonHeight: menuButton.height
    });
  },

  copyNumber() {
    wx.setClipboardData({
      data: this.data.fullPhoneNumber,
      success: () => {
        wx.makePhoneCall({
          phoneNumber: this.data.fullPhoneNumber
        });
      }
    });
  },

  btnBack() {
    wx.navigateBack();
  }
});
