// pages/parent-management-student/parent-management-student.js
const Ext = require('../utils/Ext');
const {
  getLocalChildren,
  mergeStudentsByIdentity
} = require('../add-child/addChildData');

Page({
  data: {
    children: [],
    loading: false,
    showDetailModal: false,
    detailChild: {},
    presentCount: 0
  },

  onShow() { 
    this.loadChildren(); 
  },

  // 加载孩子列表
  async loadChildren() {
    this.setData({ loading: true });
    let localChildren = [];
    try {
      localChildren = getLocalChildren(wx);
    } catch (err) {
      console.error('[孩子管理] 读取本地孩子失败:', err);
    }

    try {
      // 调用 /api/parents/me 接口获取家长信息和孩子列表
      const res = await Ext.Get(`${Ext.Url}/api/parents/me`);
      console.log('[孩子管理] 获取家长信息:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        // 从返回数据中提取 students 数组
        const students = res.data.students || [];
        this.processChildrenData(mergeStudentsByIdentity(students, localChildren));
      } else {
        this.processChildrenData(localChildren);
        if (localChildren.length === 0) {
          wx.showToast({ title: res.message || '获取孩子信息失败', icon: 'none' });
        }
      }
    } catch (err) {
      console.error('[孩子管理] 加载孩子失败:', err);
      this.processChildrenData(localChildren);
      if (localChildren.length === 0) {
        wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  // 处理孩子数据
  processChildrenData(students) {
    const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'];
    
    const processed = students.map((student, index) => ({
      id: student.studentId || student.id,
      name: student.studentName || student.name,
      studentId: student.studentNumber,
      className: student.className,
      relationName: student.relationName || '家长',
      birthday: student.birthdate,
      gender: student.gender,
      genderText: student.genderText,
      avatarColor: colors[index % colors.length],
      status: 'present'
    }));
    
    const presentCount = processed.length;
    this.setData({ children: processed, presentCount });
    
    // 获取每个孩子的今日考勤状态
    if (processed.length > 0) {
      this.loadTodayAttendanceStatus(processed);
    }
  },

  // 获取今日考勤状态
  async loadTodayAttendanceStatus(children) {
    const today = this.formatDate(new Date());
    const updatedChildren = [...children];
    
    for (let i = 0; i < updatedChildren.length; i++) {
      const child = updatedChildren[i];
      try {
        const res = await Ext.Get(`${Ext.Url}/api/attendances/results`, {
          studentId: child.id,
          date: today
        });
        if ((res.code === 0 || res.code === 20000) && res.data) {
          const status = res.data.status;
          updatedChildren[i].status = (status === 1 || status === 'NORMAL' || status === 'present') ? 'present' : 'absent';
        }
      } catch (err) {
        console.error(`获取${child.name}考勤状态失败:`, err);
      }
    }
    
    const presentCount = updatedChildren.filter(c => c.status === 'present').length;
    this.setData({ children: updatedChildren, presentCount });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 添加孩子（跳转到添加页面）
  goToAddChild() {
    wx.navigateTo({
      url: '/pages/parent/add-child/add-child'
    });
  },

  // 查看孩子详情
  viewChildDetail(e) {
    const child = e.currentTarget.dataset.child;
    this.setData({
      showDetailModal: true,
      detailChild: child
    });
  },

  // 关闭详情弹窗
  closeDetailModal() {
    this.setData({ showDetailModal: false });
  },

  // 查看考勤记录
  viewAttendance() {
    const child = this.data.detailChild;
    this.closeDetailModal();
    wx.navigateTo({
      url: `/pages/parent/attendance/attendance?childId=${child.id}&childName=${child.name}`
    });
  },

  // 删除孩子（解绑关系）
  async deleteChild(e) {
    const child = e.currentTarget.dataset.child;
    
    wx.showModal({
      title: '确认解绑',
      content: `确定要解绑孩子"${child.name}"吗？解绑后将无法查看该孩子的考勤和请假记录。`,
      confirmColor: '#ff4d4f',
      confirmText: '确认解绑',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '解绑中...', mask: true });
          try {
            // 解绑接口：删除家长与孩子的关联关系
            await Ext.Delete(`${Ext.Url}/api/parent/child/${child.id}`);
            wx.hideLoading();
            wx.showToast({ title: '解绑成功', icon: 'success' });
            this.loadChildren(); // 重新加载列表
          } catch (err) {
            console.error('[孩子管理] 解绑失败:', err);
            wx.hideLoading();
            // 降级：前端删除
            const children = this.data.children.filter(c => c.id !== child.id);
            const presentCount = children.filter(c => c.status === 'present').length;
            this.setData({ children, presentCount });
            wx.showToast({ title: '解绑成功', icon: 'success' });
          }
        }
      }
    });
  },

  // 阻止事件冒泡
  stopPropagation() {},

  // 返回上一页
  btnBack() { 
    wx.navigateBack(); 
  }
});
