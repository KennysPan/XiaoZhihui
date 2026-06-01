// pages/agent/orders/orders.js
const Ext = require('../../../utils/Ext');

Page({
  data: {
    orders: [],
    loading: false,
    statusMap: {
      pending: '待处理',
      shipped: '已发货',
      completed: '已完成'
    }
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      const res = await Ext.Get(Ext.Url + '/api/agent/orders');
      if (res.code === 200) {
        this.setData({ orders: res.data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});