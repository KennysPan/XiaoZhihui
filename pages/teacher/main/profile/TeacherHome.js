const dataService = require('../../../../utils/dataService.js');
const Ext = require('../../../../utils/Ext.js');

Page({
  data: {
    name: '',
    joinDate: '',
    status: '',
    email: '',
    school: '',
    department: '',
    managedClass: '',
    duty: '',
    miniProgramVersion: ''
  },

  async onLoad() {
    const teacherInfo = await dataService.getTeacherProfile();
    const accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : {};
    const miniProgram = accountInfo.miniProgram || {};
    this.setData({
      name: teacherInfo.name,
      status: teacherInfo.statusName,
      email: teacherInfo.email,
      joinDate: (teacherInfo.joinDate || '').slice(0, 10),
      school: teacherInfo.school,
      department: teacherInfo.department,
      managedClass: teacherInfo.managedClass,
      duty: teacherInfo.duty,
      miniProgramVersion: miniProgram.Version || '开发版'
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  btnExitLogin() {
    wx.showModal({
      title: '提示',
      content: '确定要退出吗',
      complete: (res) => {
        if (!res.confirm) {
          return;
        }

        Ext.clearToken();

        wx.reLaunch({
          url: '/pages/teacher/auth/login/login',
          success: () => {
            wx.showToast({
              title: '已退出登录',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  sscanQRCode() {
    if (!wx.canIUse('scanCode')) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本不支持扫码功能',
        showCancel: false
      });
      return;
    }

    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode'],
      success: () => {
        wx.showToast({
          title: '扫码成功',
          icon: 'success',
          duration: 1500
        });
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) {
          wx.showToast({
            title: '已取消扫码',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '扫码失败，请重试',
            icon: 'none'
          });
        }
      }
    });
  }
});
