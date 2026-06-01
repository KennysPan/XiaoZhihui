const dataService = require('../../../../utils/dataService.js');

Page({
  data: {
    menuButtonTop: 48,
    menuButtonHeight: 32,
    tName: '',
    classes: [],
    classIndex: 0,
    classList: [],
    studentList: [],
    groupMap: {},
    displayStudents: [],
    selectedStudent: null,
    currentDate: '',
    attendanceList: [],
    loading: false,
    showModal: false
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
    this.loadClassList();
  },

  onShow() {
    if (this.data.showModal && this.data.selectedStudent) {
      this.fetchAttendance();
    }
  },

  closeModal() {
    this.setData({
      showModal: false
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
      selectedStudent: student,
      showModal: true,
      attendanceList: []
    });
    this.fetchAttendance();
  },

  async loadClassList() {
    const classList = await dataService.getClasses();
    this.setData({
      classes: classList.map(item => item.name),
      classList
    });
    this.loadStudentList();
  },

  async loadStudentList() {
    const students = await dataService.getStudents();
    const map = {};

    students.forEach(stu => {
      const className = stu.className || '未分配班级';
      if (!map[className]) {
        map[className] = [];
      }
      map[className].push(stu);
    });

    this.setData({
      studentList: students,
      groupMap: map,
      displayStudents: students
    }, () => {
      this.updateDisplayStudents(this.data.classIndex);
    });
  },

  updateDisplayStudents(index) {
    const selectedClassName = this.data.classes[index];
    const students = this.data.groupMap[selectedClassName] || [];

    this.setData({
      classIndex: index,
      displayStudents: students,
      selectedStudent: students.length > 0 ? students[0] : null,
      attendanceList: []
    }, () => {
      if (this.data.selectedStudent) {
        this.fetchAttendance();
      }
    });
  },

  bindClassChange(e) {
    this.updateDisplayStudents(parseInt(e.detail.value, 10));
  },

  bindDateChange(e) {
    this.setData({
      currentDate: e.detail.value
    }, () => {
      this.fetchAttendance();
    });
  },

  goMakeupSign() {
    const student = this.data.selectedStudent;
    if (!student || !student.id) {
      wx.showToast({
        title: '请先选择学生',
        icon: 'none'
      });
      return;
    }

    const className = student.className || this.data.classes[this.data.classIndex] || '';
    wx.navigateTo({
      url: `/pages/teacher/attendance/makeupSign/MakeupSign?studentId=${student.id}&studentName=${encodeURIComponent(student.name || '')}&className=${encodeURIComponent(className)}&date=${this.data.currentDate}`
    });
  },

  onSelectStudent(e) {
    this.onTapStudent(e);
  },

  async fetchAttendance() {
    const student = this.data.selectedStudent;
    if (!student || !student.id) {
      this.setData({
        attendanceList: []
      });
      return;
    }

    this.setData({
      loading: true
    });

    try {
      const records = await dataService.getAttendanceByStudentId(student.id, this.data.currentDate);
      const attendanceList = records.map(item => ({
        ...item,
        time: this.formatTime(item.recognizeTime),
        directionText: item.directionText || (item.direction === 1 ? '进校' : '离校')
      }));

      this.setData({
        loading: false,
        attendanceList
      });
    } catch (err) {
      this.setData({
        loading: false,
        attendanceList: []
      });
    }
  },

  formatTime(dateStr) {
    if (!dateStr) {
      return '--:--';
    }
    const d = new Date(String(dateStr).replace(/-/g, '/').replace('T', ' '));
    if (isNaN(d.getTime())) {
      return '--:--';
    }
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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
