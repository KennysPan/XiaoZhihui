Page({
  data: {
    scanning: false,
    scanResult: ''
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  startScan() {
    if (this.data.scanning) {
      return;
    }

    if (!wx.canIUse('scanCode')) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本不支持扫码功能',
        showCancel: false
      });
      return;
    }

    this.setData({
      scanning: true,
      scanResult: ''
    });

    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode'],
      success: (res) => {
        this.setData({
          scanResult: res.result || ''
        });
        wx.showToast({
          title: '扫码成功',
          icon: 'success',
          duration: 1200
        });
      },
      fail: (err) => {
        const isCancel = err.errMsg && err.errMsg.includes('cancel');
        wx.showToast({
          title: isCancel ? '已取消扫码' : '扫码失败，请重试',
          icon: 'none',
          duration: 1200
        });
      },
      complete: () => {
        this.setData({
          scanning: false
        });
      }
    });
  }
});
