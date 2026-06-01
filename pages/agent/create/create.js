// pages/agent/orders/create.js
const Ext = require('../../../utils/Ext');

Page({
  data: {
    schoolId: '',
    schoolName: '',
    badgeCount: 1,
    remark: '',
    unitPrice: 5,
    submitting: false
  },

  onLoad(options) {
    this.setData({
      schoolId: options.schoolId,
      schoolName: options.schoolName
    });
  },

  decrease() {
    if (this.data.badgeCount > 1) {
      this.setData({ badgeCount: this.data.badgeCount - 1 });
    }
  },
  increase() {
    if (this.data.badgeCount < 100) {
      this.setData({ badgeCount: this.data.badgeCount + 1 });
    } else {
      wx.showToast({ title: '单次最多100枚', icon: 'none' });
    }
  },
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },
  async submitOrder() {
    const { schoolId, schoolName, badgeCount, remark, unitPrice } = this.data;
    if (badgeCount <= 0) {
      wx.showToast({ title: '数量必须大于0', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交订单...' });
    try {
      const res = await Ext.Post(Ext.Url + '/api/agent/orders/create', {
        schoolId,
        schoolName,
        badgeCount,
        remark,
        totalAmount: badgeCount * unitPrice
      });
      if (res.code === 200) {
        wx.showToast({ title: '订单提交成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: res.message || '提交失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
      wx.hideLoading();
    }
  },
  goBack() {
    wx.navigateBack();
  }
});