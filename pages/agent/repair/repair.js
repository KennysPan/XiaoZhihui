const Ext = require('../../../utils/Ext');

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

  async loadData() {
    this.setData({ loading: true });

    try {

      const res = await Ext.Get(
        Ext.Url + '/api/repair/list'
      );

      if (res.code === 200) {

        this.setData({
          list: res.data || []
        });

      }

    } finally {

      this.setData({
        loading: false
      });

    }
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

  async changeStatus(e) {

    const status = e.currentTarget.dataset.status;

    const item = this.data.currentItem;

    try {

      const res = await Ext.Post(
        Ext.Url + '/api/repair/updateStatus',
        {
          id: item.id,
          status
        }
      );

      if (res.code === 200) {

        wx.showToast({
          title: '更新成功'
        });

        this.setData({
          'currentItem.status': status
        });

        this.loadData();

      }

    } catch {

      wx.showToast({
        title: '更新失败',
        icon: 'none'
      });

    }

  }
});