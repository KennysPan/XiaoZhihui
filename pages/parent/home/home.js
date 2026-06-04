// pages/home/home.js
const Ext = require('../utils/Ext');

Page({
  data: {
    name: '加载中...',
    roleName: '学生家长',
    xueSheng: '管理孩子',
    kaoQin: '考勤查询',
    qingJia: '申请请假',
    statusBarHeight: 44,
    bannerList: [
      'https://www.kennyspan.xyz:8082/home/轮播图1.png',
      'https://www.kennyspan.xyz:8082/home/轮播图2.png'
    ],
    showDrawer: false,
    moreCategories: [
      {
        category: '常用功能',
        items: [
          { name: '管理孩子', icon: 'https://www.kennyspan.xyz:8082/home/学生管理.svg', url: '/pages/parent/parent-management-student/parent-management-student' },
          { name: '考勤查询', icon: 'https://www.kennyspan.xyz:8082/home/考勤.svg', url: '/pages/parent/attendance/attendance' },
          { name: '申请请假', icon: 'https://www.kennyspan.xyz:8082/home/请假.svg', url: '/pages/parent/parent-leave-management/parent-leave-management' },
          { name: '课程表', icon: 'https://www.kennyspan.xyz:8082/home/课程.svg', url: '/pages/parent/course-table/course-table' },
          { name: '通知公告', icon: 'https://www.kennyspan.xyz:8082/home/通知.svg', url: '/pages/parent/notice/notice' },
          { name: '德育评价', icon: 'https://www.kennyspan.xyz:8082/home/德育评价.svg', url: '/pages/parent/moral-evaluation/moral-evaluation' },
          { name: '请假审批', icon: 'https://www.kennyspan.xyz:8082/home/请假审批.svg', url: '/pages/parent/leave-approval-list/leave-approval-list' }
        ]
      },
      {
        category: '德育成长',
        items: [
          { name: '荣誉墙', icon: 'https://www.kennyspan.xyz:8082/home/荣誉墙.svg', url: '' }
        ]
      },
      {
        category: '系统管理',
        items: [
          { name: '增补校徽', icon: 'https://www.kennyspan.xyz:8082/home/增补校徽.svg', url: '/pages/parent/badge-replenish/badge-replenish' }
        ]
      }
    ]
  },

  onShow() {
    this.setStatusBarHeight();
    if (!Ext.isLogin()) {
      Ext.handleTokenExpired();
      return;
    }
    if (!Ext.isParent()) {
      wx.showModal({
        title: '提示',
        content: '您不是家长账号，请使用家长账号登录',
        showCancel: false,
        success: () => {
          Ext.clearToken();
          wx.reLaunch({ url: '/pages/roleSelect/roleSelect?manual=1' });
        }
      });
      return;
    }
    this.loadParentInfo();
    this.updateTabBarSelected();
  },

  setStatusBarHeight() {
    try {
      const app = getApp();
      const statusBarHeight = app && app.globalData && app.globalData.statusBarHeight
        ? app.globalData.statusBarHeight
        : (wx.getSystemInfoSync().statusBarHeight || 44);
      this.setData({ statusBarHeight });
    } catch (err) {
      console.error('[Home] 设置状态栏高度失败:', err);
    }
  },

  async loadParentInfo() {
    try {
      wx.showLoading({ title: '加载中...', mask: false });
      const res = await Ext.Get(`${Ext.Url}/api/parents/me`);
      wx.hideLoading();

      if (res.code === 0 || res.code === 20000) {
        const parent = res.data;
        let displayName = parent.name || parent.phone || '家长';
        this.setData({ name: displayName });
      } else {
        wx.showToast({ title: res.message || '获取信息失败', icon: 'none' });
        if (res.code === 401) {
          Ext.handleTokenExpired();
        }
      }
    } catch (err) {
      wx.hideLoading();
      console.error('[Home] 加载家长信息异常:', err);
      this.setData({ name: '家长用户' });
      wx.showToast({ title: '获取信息失败，请稍后刷新', icon: 'none', duration: 2000 });
    }
  },

  updateTabBarSelected() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  btnManageStudent() {
    wx.navigateTo({ url: '/pages/parent/parent-management-student/parent-management-student' });
  },
  btnAttendance() {
    wx.navigateTo({ url: '/pages/parent/attendance/attendance' });
  },
  LeaveManagement() {
    wx.navigateTo({ url: '/pages/parent/parent-leave-management/parent-leave-management' });
  },
  btnCourseTable() {
    wx.navigateTo({ url: '/pages/parent/course-table/course-table' });
  },
  btnNotice() {
    wx.navigateTo({ url: '/pages/parent/notice/notice' });
  },
  btnMoralEvaluation() {
    wx.navigateTo({ url: '/pages/parent/moral-evaluation/moral-evaluation' });
  },
  btnPersonalCenter() {
    wx.redirectTo({ url: '/pages/parent/parentCenter/parentcenter' });
  },
  openMoreDrawer() {
    this.setData({ showDrawer: true });
  },
  closeDrawer() {
    this.setData({ showDrawer: false });
  },
  onDrawerItemTap(e) {
    const url = e.currentTarget.dataset.url;
    const name = e.currentTarget.dataset.name;
    if (url && url !== '') {
      this.closeDrawer();
      wx.navigateTo({ url });
    } else {
      wx.showToast({ title: `${name}功能开发中`, icon: 'none', duration: 1500 });
    }
  },
  preventMove() {}
});
