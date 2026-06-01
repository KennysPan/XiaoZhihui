const dataService = require('../../../../utils/dataService.js');

Page({
  data: {
    tName: '',
    menuButtonTop: 48,
    menuButtonHeight: 32,
    functionList: [
      {
        key: 'student',
        name: '学生管理',
        desc: '查看学生档案与班级学生列表',
        icon: 'https://www.kennyspan.xyz:8082/home/学生管理.svg'
      },
      {
        key: 'attendance',
        name: '考勤管理',
        desc: '查看学生到校、离校与补签记录',
        icon: 'https://www.kennyspan.xyz:8082/home/考勤.svg'
      },
      {
        key: 'appraise',
        name: '学生评价',
        desc: '生成评语、保存评分并查看评价记录',
        icon: '/assets/home/student-appraise.svg'
      },
      {
        key: 'classAppraise',
        name: '班级评比',
        desc: '维护班级评分、生成评比说明并查看排行记录',
        icon: '/assets/home/class-appraise.svg'
      },
      {
        key: 'honorWall',
        name: '荣誉墙',
        desc: '展示学生荣誉记录，并支持快速添加班级亮点',
        icon: '/assets/home/honor-wall.svg'
      },
      {
        key: 'announcements',
        name: '公告',
        desc: '查看全部已接收公告与通知详情',
        icon: '/assets/home/announcement.svg'
      },
      {
        key: 'leave',
        name: '请假管理',
        desc: '查看请假申请并处理审批',
        icon: 'https://www.kennyspan.xyz:8082/home/请假.svg'
      },
      {
        key: 'profile',
        name: '个人信息',
        desc: '查看教师资料与当前账号信息',
        icon: 'https://www.kennyspan.xyz:8082/home/个人.svg'
      },
      {
        key: 'scan',
        name: '扫一扫',
        desc: '扫描二维码完成现场核验',
        icon: 'https://www.kennyspan.xyz:8082/home/扫一扫.svg'
      }
    ]
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
  async onLoad(options = {}) {
    this.setMenuButtonLayout();
    const teacher = await dataService.getTeacherProfile();
    this.setData({
      tName: options.tName ? decodeURIComponent(options.tName) : teacher.name
    });
  },

  handleFunctionTap(e) {
    const key = e.currentTarget.dataset.key;
    const routeMap = {
      student: `/pages/teacher/student/management/ParentManagementStudent?tName=${encodeURIComponent(this.data.tName)}`,
      attendance: `/pages/teacher/attendance/attendance/Attendance?tName=${encodeURIComponent(this.data.tName)}`,
      appraise: '/pages/teacher/appraise/student/StudentAppraise',
      classAppraise: '/pages/teacher/appraise/class/ClassAppraise',
      honorWall: '/pages/teacher/honor/wall/HonorWall',
      announcements: '/pages/teacher/announcement/list/AnnouncementList',
      leave: '/pages/teacher/leave/management/LeaveManagement',
      profile: '/pages/teacher/main/profile/TeacherHome'
    };

    if (key === 'scan') {
      this.scanQRCode();
      return;
    }

    const url = routeMap[key];
    if (!url) {
      wx.showToast({
        title: '功能暂未开放',
        icon: 'none'
      });
      return;
    }

    if (key === 'profile') {
      wx.switchTab({
        url
      });
      return;
    }

    wx.navigateTo({
      url
    });
  },

  scanQRCode() {
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
        if (err.errMsg && err.errMsg.includes('cancel')) {
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
  },

  btnBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({
          url: '/pages/teacher/main/home/home'
        });
      }
    });
  }
});
