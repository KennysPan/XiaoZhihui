// pages/agent/orders/orders.js
const Ext = require('../../../utils/Ext');
const {
  getMockOrders,
  resolveListData
} = require('../utils/mockAgentData');

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
        this.setData({ orders: resolveListData(res.data, getMockOrders()) });
      }
    } catch (err) {
      console.error(err);
      this.setData({ orders: getMockOrders() });
    } finally {
      this.setData({ loading: false });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
