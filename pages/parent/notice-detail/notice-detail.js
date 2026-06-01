const Ext = require('../utils/Ext.js');

Page({
  data: {
    notice: {},
    loading: true
  },

  onLoad(options) {
    if (options.data) {
      try {
        const notice = JSON.parse(decodeURIComponent(options.data));
        this.setData({ notice, loading: false });
      } catch (err) {
        console.error('解析公告数据失败', err);
        this.loadNoticeById(options.id);
      }
    } else if (options.id) {
      this.loadNoticeById(options.id);
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  async loadNoticeById(id) {
    this.setData({ loading: true });
    try {
      const res = await Ext.Get(Ext.Url + '/api/parent/notice/detail', { id });
      if (res.code === 200 && res.data) {
        this.setData({ notice: res.data });
      } else {
        this.loadMockDetail(id);
      }
    } catch (err) {
      this.loadMockDetail(id);
    } finally {
      this.setData({ loading: false });
    }
  },

  loadMockDetail(id) {
    const mockNotice = {
      id: id,
      title: '关于清明节放假安排的通知',
      content: '<p>各位家长：</p><p>根据国家法定节假日规定，<strong>4月4日至4月6日放假三天</strong>，4月7日（周一）正常上课。</p><p>请家长安排好孩子的作息，注意安全。</p><img src="https://picsum.photos/300/200?random=1" style="width:100%; border-radius:16rpx; margin:20rpx 0;" /><video src="https://www.w3schools.com/html/mov_bbb.mp4" controls style="width:100%; border-radius:16rpx; margin:20rpx 0;"></video>',
      publishTime: '2026-03-28',
      isImportant: true,
      viewCount: 245,
      author: '教务处'
    };
    this.setData({ notice: mockNotice });
  },

  goBack() {
    wx.navigateBack();
  }
});
