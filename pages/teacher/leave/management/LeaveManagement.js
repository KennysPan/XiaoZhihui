const dataService = require('../../../../utils/dataService.js');

function getLeaveStatusClass(status) {
  if (status === '已通过') {
    return 'leave-card-approved';
  }

  if (status === '已驳回') {
    return 'leave-card-rejected';
  }

  return 'leave-card-pending';
}

function withStatusClass(list = []) {
  return list.map(item => ({
    ...item,
    statusClass: getLeaveStatusClass(item.status)
  }));
}

Page({
  data: {
    navHeight: 44,
    statusBarHeight: 20,
    menuButtonHeight: 32,
    menuButtonTop: 24,
    loading: false,
    tipText: '请假记录加载中...',
    leaveList: []
  },
  setMenuButtonLayout() {
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    if (menu && menu.top && menu.height) {
      this.setData({
        menuButtonTop: menu.top,
        menuButtonHeight: menu.height
      });
    }
  },


  onLoad() {
    this.setMenuButtonLayout();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const systemInfo = wx.getSystemInfoSync();

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      menuButtonHeight: menuButton.height,
      menuButtonTop: menuButton.top,
      navHeight: menuButton.bottom + menuButton.top - systemInfo.statusBarHeight
    });

    this.loadLeaveList();
  },

  async loadLeaveList() {
    this.setData({
      loading: true,
      tipText: '请假记录加载中...'
    });

    try {
      const leaveList = await dataService.getLeaveList();
      const hasApiData = leaveList.some(item => item.isFromApi);

      this.setData({
        leaveList: withStatusClass(leaveList),
        tipText: hasApiData ? '请假记录已从接口加载。' : '接口暂无请假记录，当前显示本地演示数据。'
      });
    } catch (error) {
      this.setData({
        leaveList: withStatusClass([]),
        tipText: '请假记录加载失败'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  btnBack() {
    wx.navigateBack();
  },

  goToDetail(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.leaveList[index];
    const itemStr = JSON.stringify(item);
    const that = this;

    wx.navigateTo({
      url: `/pages/teacher/leave/approval/LeaveApproval?index=${index}&info=${encodeURIComponent(itemStr)}`,
      events: {
        updateStatus(data) {
          const list = that.data.leaveList.slice();
          list[data.index].status = data.status;
          list[data.index].teacher = data.teacher || list[data.index].teacher || '';
          list[data.index].approverRemark = data.approverRemark || '';
          list[data.index].statusClass = getLeaveStatusClass(data.status);
          that.setData({
            leaveList: list
          });
        }
      }
    });
  }
});
