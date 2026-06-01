const Ext = require('../utils/Ext');

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
        const records = res.data.items || [];
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
    let filtered = [];
    
    // 状态映射: 1-待审批, 2-已通过, 3-未通过
    if (currentTab === 0) {
      filtered = leaveList.filter(item => item.statusId === 1);
    } else if (currentTab === 1) {
      filtered = leaveList.filter(item => item.statusId === 2);
    } else {
      filtered = leaveList.filter(item => item.statusId === 3);
    }
    
    const pendingCount = leaveList.filter(item => item.statusId === 1).length;
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
