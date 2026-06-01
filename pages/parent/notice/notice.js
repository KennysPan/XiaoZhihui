const Ext = require('../utils/Ext.js');

Page({
  data: {
    noticeList: [],
    loading: false
  },

  onLoad() {
    this.loadNotices();
  },

// 修改 loadNotices 方法
async loadNotices() {
  this.setData({ loading: true });
  try {
    const res = await Ext.Get(`${Ext.Url}/api/announcements`);
    if ((res.code === 0 || res.code === 20000) && res.data) {
      const notices = (res.data.items || []).map(item => ({
        id: item.id,
        title: item.title,
        summary: item.content?.substring(0, 100) + '...' || '',
        content: item.content,
        publishTime: item.publishTime?.split(' ')[0] || item.createdTime?.split(' ')[0],
        isImportant: item.topLevel === 1,
        viewCount: item.readCount || 0
      }));
      this.setData({ noticeList: notices });
    }
  } catch (err) {
    console.error('加载公告失败', err);
    this.setData({ noticeList: [] });
  } finally {
    this.setData({ loading: false });
  }
},
  loadMockNotices() {
    const mockList = [
      {
        id: 1,
        title: '关于清明节放假安排的通知',
        summary: '根据国家法定节假日规定，4月4日至4月6日放假三天...',
        content: '<p>各位家长：</p><p>根据国家法定节假日规定，<strong>4月4日至4月6日放假三天</strong>，4月7日（周一）正常上课。</p><p>请家长安排好孩子的作息，注意安全。</p><img src="https://picsum.photos/300/200?random=1" style="width:100%; border-radius:16rpx; margin:20rpx 0;" /><p>祝您节日安康！</p>',
        publishTime: '2026-03-28',
        isImportant: true,
        viewCount: 245
      },
      {
        id: 2,
        title: '春季校园运动会报名开始',
        summary: '请有意参加运动会的同学在本周五前向班主任报名...',
        content: '<p>为增强学生体质，学校将于<strong>4月15日</strong>举办春季运动会。</p><p>请有意参加运动会的同学在本周五前向班主任报名。</p><p>具体项目：</p><ul><li>100米跑</li><li>跳远</li><li>跳绳</li><li>接力赛</li></ul><img src="https://picsum.photos/300/200?random=2" style="width:100%; border-radius:16rpx; margin:20rpx 0;" /><p>欢迎大家踊跃报名！</p>',
        publishTime: '2026-03-25',
        isImportant: false,
        viewCount: 128
      },
      {
        id: 3,
        title: '家长会通知',
        summary: '本周五下午召开三年级家长会，请各位家长准时参加...',
        content: '<p><strong>三年级家长会</strong>定于<strong style="color:#5fd9a8;">3月29日（周五）下午15:00</strong>在多功能厅召开。</p><p>议程安排：</p><ol><li>学期教学总结</li><li>学生表现反馈</li><li>家校互动交流</li></ol><p>请家长安排好时间准时出席。</p><img src="https://picsum.photos/300/200?random=3" style="width:100%; border-radius:16rpx; margin:20rpx 0;" />',
        publishTime: '2026-03-24',
        isImportant: true,
        viewCount: 389
      }
    ];
    this.setData({ noticeList: mockList });
  },

  // 跳转到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const notice = this.data.noticeList.find(item => item.id === id);
    if (notice) {
      const encodedData = encodeURIComponent(JSON.stringify(notice));
      wx.navigateTo({
        url: `/pages/parent/notice-detail/notice-detail?data=${encodedData}`
      });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
