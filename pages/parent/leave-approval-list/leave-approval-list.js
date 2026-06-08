const Ext = require('../utils/Ext');
const {
  filterLeaveRecords,
  getPendingLeaveRecords,
  unwrapLeaveItems
} = require('./leaveApprovalData');

Page({
  data: {
    leaveList: [],
    filteredList: [],
    currentTab: 0,
    loading: false,
    showDetailModal: false,
    currentLeave: null,
    pendingCount: 0
  },

  onLoad() {
    this.loadLeaveData();
  },

  async loadLeaveData() {
    this.setData({ loading: true });
    try {
      const res = await Ext.Get(`${Ext.Url}/api/leaves/records`);
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const records = unwrapLeaveItems(res.data);
        this.setData({ leaveList: records });
      } else {
        this.setData({ leaveList: [] });
      }
    } catch (err) {
      console.error('加载失败', err);
      this.setData({ leaveList: [] });
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      this.filterList();
    }
  },

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ currentTab: index });
    this.filterList();
  },

  filterList() {
    const { leaveList, currentTab } = this.data;
    const filtered = filterLeaveRecords(leaveList, currentTab);
    const pendingCount = getPendingLeaveRecords(leaveList).length;
    this.setData({ filteredList: filtered, pendingCount });
  },

  viewDetail(e) {
    const index = e.currentTarget.dataset.index;
    const leave = this.data.filteredList[index];
    this.setData({
      showDetailModal: true,
      currentLeave: leave
    });
  },

  closeDetailModal() {
    this.setData({
      showDetailModal: false,
      currentLeave: null
    });
  },

  stopPropagation() {},
  
  goBack() {
    wx.navigateBack();
  }
});
