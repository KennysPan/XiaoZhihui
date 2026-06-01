// pages/repassword/repassword.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
		phoneNumber:'198****2296',
		fullPhoneNumber:'19831962296',
		statusBarHeight:20,
		menuButtonTop:24,
		menuButtonHeight:32,
  },
	onLoad(options){//程序进入该页面时执行 不能只写onLoad还要加上括号的内容
		const menuButton = wx.getMenuButtonBoundingClientRect();
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      menuButtonTop: menuButton.top,
      menuButtonHeight: menuButton.height
    });
	},
	//复制完整的电话号码调用手机拨号页面进行粘贴
	copyNumber() {
		const that = this;
		wx.setClipboardData({
			data: this.data.fullPhoneNumber, // 待复制的完整号码
			success: () => {
				// 复制成功后直接尝试拉起拨号盘
				wx.makePhoneCall({
					phoneNumber: that.data.fullPhoneNumber, // 必须是纯数字，不能带星号
					success: () => {
						console.log('成功拉起拨号系统');
					},
					fail: (res) => {
						// 用户点击取消也会进入这里
						console.log('用户取消或调用失败', res);
					}
				});
			}
		});
	},
	btnBack() {
    wx.navigateBack();
  }
})