// pages/agent/home/home.js
const Ext = require('../../../utils/Ext');

Page({
  data: {
    agentName: '',
    currentDate: '',
    statistics: {
      todayIncome: 0,
      monthOrderCount: 0,
      monthIncome: 0,
      totalIncome: 0,
      totalSchools: 0,
      pendingOrders: 0
    },
    quickActions: [
      { name: '学校管理', shortName: '校', url: '/pages/agent/schools/schools', color: '#5fd9a8' },
      { name: '补货订单', shortName: '单', url: '/pages/agent/orders/orders', color: '#ff6b6b' },
      { name: '收益统计', shortName: '收', url: '/pages/agent/income/income', color: '#ffa500' },
      { name: '个人中心', shortName: '我', url: '/pages/agent/profile/profile', color: '#4a90e2' }
    ],
    loading: false
  },

  onShow() {
    const agentInfo = wx.getStorageSync('agentInfo');
    if (agentInfo) {
      this.setData({ agentName: agentInfo.name });
    }
    this.setCurrentDate();
    this.loadStatistics();
  },

  setCurrentDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    this.setData({ currentDate: `${year}.${month}.${day} ${weekday}` });
  },

  async loadStatistics() {
    this.setData({ loading: true });
    try {
      const res = await Ext.Get(Ext.Url + '/api/agent/statistics');
      if (res.code === 200) {
        this.setData({ statistics: res.data });
      }
    } catch (err) {
      console.error('加载统计数据失败', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    const tabLikePages = [
      '/pages/agent/home/home',
      '/pages/agent/orders/orders',
      '/pages/agent/profile/profile'
    ];
    if (tabLikePages.includes(url)) {
      wx.redirectTo({ url });
      return;
    }
    wx.navigateTo({ url });
  },

  goToOrders() {
    wx.redirectTo({ url: '/pages/agent/orders/orders' });
  }
});
