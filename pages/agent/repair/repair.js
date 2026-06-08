const {
  getMockRepairList,
  updateRepairStatus
} = require('../utils/mockAgentData');

Page({
  data: {
    list: [],
    loading: false,

    showDetail: false,

    currentItem: null,

    statusOptions: [
      '未维修',
      '维修中',
      '已维修'
    ]
  },

  onShow() {
    this.loadData();
  },

  goBack() {
    wx.navigateBack();
  },

  loadData() {
    this.setData({
      list: getMockRepairList(),
      loading: false
    });
  },

  openDetail(e) {

    const item = e.currentTarget.dataset.item;

    this.setData({
      currentItem: item,
      showDetail: true
    });

  },

  closeDetail() {

    this.setData({
      showDetail: false
    });

  },

  changeStatus(e) {

    const status = e.currentTarget.dataset.status;

    const item = this.data.currentItem;

    const list = updateRepairStatus(this.data.list, item.id, status);
    const currentItem = list.find(record => String(record.id) === String(item.id)) || item;

    this.setData({
      list,
      currentItem
    });

    wx.showToast({
      title: '更新成功'
    });

  }
});
