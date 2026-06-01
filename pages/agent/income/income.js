// pages/agent/income/income.js
const Ext = require('../../../utils/Ext');

Page({
  data: {
    totalIncome: 0,
    thisMonthIncome: 0,
    records: [],
    loading: false
  },

  onShow() {
    this.loadIncomeData();
  },

  async loadIncomeData() {
    this.setData({ loading: true });
    try {
      // 实际接口可返回收益明细，这里用统计数据模拟
      const res = await Ext.Get(Ext.Url + '/api/agent/statistics');
      if (res.code === 200) {
        this.setData({
          totalIncome: 28600,        // 模拟累计收益
          thisMonthIncome: res.data.todayIncome * 15, // 模拟本月收益
          records: [
            { date: '2026-05-01', amount: 1280, orderId: '1001' },
            { date: '2026-04-28', amount: 500, orderId: '1002' },
            { date: '2026-04-20', amount: 750, orderId: '1003' }
          ]
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goBack() { wx.navigateBack(); }
});