const dataService = require('../../../../utils/dataService.js');

function getCurrentTeacherName() {
  const teacherInfo = wx.getStorageSync('teacher_Info') || {};
  const userInfo = wx.getStorageSync('user_info') || {};
  return teacherInfo.name || teacherInfo.teacherName || userInfo.name || userInfo.userName || '当前教师';
}

Page({
  data: {
    studentInfo: {},
    currentIndex: null,
    statusBarHeight: 20,
    navHeight: 44,
    menuButtonTop: 24,
    menuButtonHeight: 32,
    approvalRemark: '',
    canApprove: false,
    approving: false
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


  onLoad(options = {}) {
    this.setMenuButtonLayout();
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const systemInfo = wx.getSystemInfoSync();
    let info = dataService.getLeaveByIndex(options.index);

    if (options && options.info) {
      try {
        info = JSON.parse(decodeURIComponent(options.info));
      } catch (e) {}
    }

    this.setData({
      studentInfo: info,
      currentIndex: Number(options.index || 0),
      statusBarHeight: systemInfo.statusBarHeight,
      menuButtonTop: menuButton.top,
      menuButtonHeight: menuButton.height,
      navHeight: menuButton.bottom + menuButton.top - systemInfo.statusBarHeight,
      approvalRemark: info.approverRemark || '',
      canApprove: info.status !== '已通过' && info.status !== '已驳回'
    });
  },

  onRemarkInput(e) {
    this.setData({
      approvalRemark: e.detail.value
    });
  },

  async handleAction(newStatus) {
    if (this.data.approving) {
      return;
    }

    this.setData({
      approving: true
    });

    try {
      const info = this.data.studentInfo || {};
      if (info.isFromApi && info.id) {
        await dataService.approveLeaveRecord(info.id, newStatus, this.data.approvalRemark);
      }
    } catch (error) {
      wx.showToast({
        title: error && error.message ? error.message : '审批失败',
        icon: 'none',
        duration: 2000
      });
      this.setData({
        approving: false
      });
      return;
    }

    try {
      const eventChannel = this.getOpenerEventChannel();
      const teacher = getCurrentTeacherName();
      eventChannel.emit('updateStatus', {
        index: this.data.currentIndex,
        status: newStatus,
        teacher,
        approverRemark: this.data.approvalRemark
      });
      this.setData({
        studentInfo: {
          ...this.data.studentInfo,
          status: newStatus,
          teacher,
          approverRemark: this.data.approvalRemark
        }
      });
    } catch (e) {}

    wx.showToast({
      title: newStatus === '已通过' ? '已批准' : '已驳回',
      icon: 'success',
      mask: true,
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    });
  },

  btnBack() {
    wx.navigateBack();
  },

  onApprove() {
    this.handleAction('已通过');
  },

  onReject() {
    this.handleAction('已驳回');
  },

  onReapprove() {
    const nextInfo = {
      ...this.data.studentInfo,
      status: '未处理',
      teacher: '',
      approverRemark: ''
    };

    try {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('updateStatus', {
        index: this.data.currentIndex,
        status: '未处理',
        teacher: '',
        approverRemark: ''
      });
    } catch (e) {}

    this.setData({
      studentInfo: nextInfo,
      canApprove: true,
      approvalRemark: ''
    });
  }
});
