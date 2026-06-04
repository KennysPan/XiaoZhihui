const dataService = require('../../../../utils/dataService.js');

Page({
  data: {
    menuButtonTop: 48,
    menuButtonHeight: 32,
    tName: '',
    classList: [],
    classDailyList: [],
    selectedClassDetail: null,
    selectedStudentDetail: null,
    currentDate: '',
    loading: false,
    showClassModal: false
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
      tName: options.tName ? decodeURIComponent(options.tName) : teacher.name,
      currentDate: dataService.getDefaultDate()
    });
    this.loadClassDailyList();
  },

  onShow() {
    if (!this.data.currentDate) {
      return;
    }
    this.loadClassDailyList();
  },

  closeModal() {
    this.setData({
      showClassModal: false,
      selectedStudentDetail: null
    });
  },

  onTapClass(e) {
    const classDetail = e.currentTarget.dataset.class;
    if (!classDetail || !classDetail.classId) {
      wx.showToast({
        title: '班级信息异常',
        icon: 'none'
      });
      return;
    }

    this.setData({
      selectedClassDetail: classDetail,
      selectedStudentDetail: null,
      showClassModal: true
    });
  },

  onTapStudent(e) {
    const student = e.currentTarget.dataset.student;
    if (!student || !student.id) {
      wx.showToast({
        title: '学生信息异常',
        icon: 'none'
      });
      return;
    }

    this.setData({
      selectedStudentDetail: student
    });
  },

  backToStudentList() {
    this.setData({
      selectedStudentDetail: null
    });
  },

  async loadClassDailyList() {
    this.setData({
      loading: true
    });

    try {
      const classList = await dataService.getClasses();
      const classDailyList = await Promise.all(
        classList.map(item => dataService.getClassDailyAttendance(item, this.data.currentDate))
      );

      this.setData({
        loading: false,
        classList,
        classDailyList
      });
    } catch (err) {
      this.setData({
        loading: false,
        classDailyList: []
      });
      wx.showToast({
        title: '考勤加载失败',
        icon: 'none'
      });
    }
  },

  bindDateChange(e) {
    this.setData({
      currentDate: e.detail.value
    }, () => {
      this.loadClassDailyList();
    });
  },

  goMakeupSign(e) {
    const student = e.currentTarget.dataset.student;
    if (!student || !student.id) {
      wx.showToast({
        title: '学生信息异常',
        icon: 'none'
      });
      return;
    }

    const className = student.className || (this.data.selectedClassDetail && this.data.selectedClassDetail.className) || '';
    wx.navigateTo({
      url: `/pages/teacher/attendance/makeupSign/MakeupSign?studentId=${student.id}&studentName=${encodeURIComponent(student.name || '')}&className=${encodeURIComponent(className)}&date=${this.data.currentDate}`
    });
  },

  noop() {
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
