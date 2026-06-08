const Ext = require('../utils/Ext');
const { getPendingLeaveRecords } = require('../leave-approval-list/leaveApprovalData');
const {
  getLocalChildren,
  mergeStudentsByIdentity
} = require('../add-child/addChildData');

Page({
  data: {
    parentInfo: { name: '', phone: '', relation: '家长' },
    children: [],
    leaveApprovals: [],
    loading: false,
    showLeaveDetailModal: false,
    currentLeave: null,
    cacheSize: '12.5'
  },

  onLoad() { 
    this.loadData(); 
  },
  
  onShow() { 
    this.updateTabBarSelected();
    this.loadData(); 
  },

  updateTabBarSelected() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  async loadData() {
    this.setData({ loading: true });
    let localChildren = [];
    let loadedChildren = false;
    try {
      localChildren = getLocalChildren(wx);
    } catch (err) {
      console.error('读取本地孩子失败', err);
    }

    try {
      // 获取家长信息和孩子列表（同一个接口）
      const meRes = await Ext.Get(`${Ext.Url}/api/parents/me`);
      
      if ((meRes.code === 0 || meRes.code === 20000) && meRes.data) {
        const parent = meRes.data;
        const children = this.normalizeChildren(mergeStudentsByIdentity(parent.students || [], localChildren));
        this.setData({
          parentInfo: {
            name: parent.name || parent.phone || '家长',
            phone: parent.phone || '',
            relation: '家长'
          },
          children
        });
        loadedChildren = true;
      } else {
        this.setData({ children: this.normalizeChildren(localChildren) });
        loadedChildren = true;
      }
      
      // 获取待审批的请假记录
      const leaveRes = await Ext.Get(`${Ext.Url}/api/leaves/records`, { statusId: 1 });
      if ((leaveRes.code === 0 || leaveRes.code === 20000) && leaveRes.data) {
        this.setData({ leaveApprovals: getPendingLeaveRecords(leaveRes.data) });
      }
    } catch (err) {
      console.error('加载数据失败', err);
      if (!loadedChildren) {
        this.setData({ children: this.normalizeChildren(localChildren) });
      }
      if (localChildren.length === 0) {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  normalizeChildren(students) {
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'];
    return (students || []).map((student, index) => {
      const name = student.studentName || student.name || '学生';
      const className = student.className || student.class || '未分班';
      const gradeName = student.gradeName || student.grade || '';
      return {
        ...student,
        id: student.studentId || student.id || student.studentNumber || index,
        name,
        initials: name.slice(0, 1),
        gradeName,
        className,
        displayClass: gradeName ? `${gradeName} ${className}` : className,
        relationName: student.relationName || student.relation || '家长',
        studentNumber: student.studentNumber || student.studentNo || '',
        avatarColor: colors[index % colors.length]
      };
    });
  },

  goToAttendance() { 
    wx.navigateTo({ url: '/pages/parent/attendance/attendance' }); 
  },

  goToManageChildren() {
    wx.navigateTo({ url: '/pages/parent/parent-management-student/parent-management-student' });
  },

  goToAddChild() {
    wx.navigateTo({ url: '/pages/parent/add-child/add-child' });
  },

  goToLeaveList() {
    wx.navigateTo({ url: '/pages/parent/leave-approval-list/leave-approval-list' });
  },

  viewChildDetail(e) {
    const child = e.currentTarget.dataset.child;
    wx.navigateTo({ url: `/pages/parent/attendance/attendance?childId=${child.studentId || child.id}` });
  },

  viewLeaveDetail(e) {
    const index = e.currentTarget.dataset.index;
    const leave = this.data.leaveApprovals[index];
    this.setData({
      showLeaveDetailModal: true,
      currentLeave: leave
    });
  },

  closeLeaveDetailModal() {
    this.setData({
      showLeaveDetailModal: false,
      currentLeave: null
    });
  },

  editProfile() { 
    wx.showToast({ title: '功能开发中', icon: 'none' }); 
  },

  changeAvatar() { 
    wx.showToast({ title: '功能开发中', icon: 'none' }); 
  },

  changePassword() { 
    wx.navigateTo({ url: '/pages/parent/repassword/repassword' }); 
  },

  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              this.setData({ cacheSize: '0' });
              wx.showToast({ title: '清除成功', icon: 'success' });
            }
          });
        }
      }
    });
  },

  showAbout() {
    wx.navigateTo({ url: '/pages/parent/about/about' });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await Ext.Delete(`${Ext.Url}/api/sessions`);
          } catch (err) {
            console.error('退出登录接口失败', err);
          }
          Ext.clearToken();
          wx.reLaunch({ url: '/pages/parent/login/login' });
        }
      }
    });
  },

  stopPropagation() {}
});
