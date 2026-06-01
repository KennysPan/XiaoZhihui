const dataService = require('../../../../utils/dataService.js');

const ANNOUNCEMENT_STORAGE_KEY = 'home_announcement_records_v2';

function getDefaultAnnouncements() {
  return [
    {
      id: 'notice-1',
      title: '本周班会安排',
      content: '本周五下午第三节课召开主题班会，请各班提前准备班级近况汇报、优秀作业展示材料和下周值日安排，班主任需在会后完成记录上传。',
      publisher: '林知夏',
      time: '2026-04-18 09:00'
    },
    {
      id: 'notice-2',
      title: '阅读打卡提醒',
      content: '请提醒学生完成本周阅读打卡，并在周日前提交阅读摘记；语文课代表统一收齐纸质摘记，未完成名单请同步反馈给任课教师。',
      publisher: '林知夏',
      time: '2026-04-17 16:30'
    }
  ];
}

Page({
  data: {
    name: '',
    roleName: '班主任',
    school: '',
    qingJia: '管理请假',
    xueSheng: '查看学生',
    kaoQin: '管理考勤',
    pingJia: '学生评价',
    studentList: [],
    classList: [],
    announcementList: [],
    latestAnnouncement: null,
    announcementDetailVisible: false,
    selectedAnnouncement: null
  },

  onLoad() {
    this.loadHomeData();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  goToClassDetail(e) {
    const classItem = e.currentTarget.dataset.class;
    if (!classItem || !classItem.classId) {
      wx.showToast({
        title: '班级信息异常',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/teacher/class/detail/classdetail?classId=${classItem.classId}&className=${encodeURIComponent(classItem.name)}`
    });
  },

  btnPersonalCenter() {
    wx.switchTab({
      url: '/pages/teacher/main/profile/TeacherHome'
    });
  },

  btnBack() {
    wx.navigateBack();
  },

  btnManageStudent() {
    wx.navigateTo({
      url: `/pages/teacher/student/management/ParentManagementStudent?tName=${encodeURIComponent(this.data.name)}`
    });
  },

  btnAttendance() {
    wx.navigateTo({
      url: `/pages/teacher/attendance/attendance/Attendance?tName=${encodeURIComponent(this.data.name)}`
    });
  },

  btnStudentAppraise() {
    wx.navigateTo({
      url: '/pages/teacher/appraise/student/StudentAppraise'
    });
  },

  goMoreFunctions() {
    wx.navigateTo({
      url: `/pages/teacher/main/functionCenter/FunctionCenter?tName=${encodeURIComponent(this.data.name)}`
    });
  },

  LeaveManagement() {
    wx.navigateTo({
      url: '/pages/teacher/leave/management/LeaveManagement'
    });
  },

  async loadHomeData() {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const [teacherInfo, classList, studentList, apiAnnouncements] = await Promise.all([
        dataService.getTeacherProfile(),
        dataService.getClasses(),
        dataService.getStudents(),
        dataService.getAnnouncements()
      ]);
      const announcementList = apiAnnouncements.length ? apiAnnouncements : this.getAnnouncementList();

      this.setData({
        name: teacherInfo.name,
        roleName: teacherInfo.duty,
        school: teacherInfo.school,
        classList,
        studentList,
        announcementList,
        latestAnnouncement: announcementList[0] || null
      });
      wx.setStorageSync('teacher_Info', teacherInfo);
    } catch (error) {
      wx.showToast({
        title: '首页数据加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  getAnnouncementList() {
    const records = wx.getStorageSync(ANNOUNCEMENT_STORAGE_KEY);
    if (Array.isArray(records)) {
      return records;
    }

    return getDefaultAnnouncements();
  },

  showAnnouncementDetail(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) {
      return;
    }

    this.setData({
      selectedAnnouncement: item,
      announcementDetailVisible: true
    });
  },

  hideAnnouncementDetail() {
    this.setData({
      selectedAnnouncement: null,
      announcementDetailVisible: false
    });
  },

  noop() {
  }
});
