Page({
  goBack() {
    wx.navigateBack();
  },

  viewAgreement() {
    wx.showModal({
      title: '用户服务协议',
      content: '欢迎使用智慧校园家长端。本协议是您与智慧校园团队之间关于使用本服务的法律协议。使用本服务即表示您同意本协议的全部条款。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  viewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们非常重视您的隐私保护。本隐私政策说明我们如何收集、使用和保护您的个人信息。我们不会将您的信息出售给任何第三方。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});