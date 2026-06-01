const echarts = require('../ec-canvas/echarts');
const dataService = require('../../../../utils/dataService.js');

let currentChartPage = null;

function initAttendanceChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width,
    height,
    devicePixelRatio: dpr
  });

  canvas.setChart(chart);

  if (currentChartPage) {
    currentChartPage.attendanceChart = chart;
    chart.setOption(currentChartPage.getAttendanceChartOption());
  }

  return chart;
}

function parseClassName(className) {
  if (!className) {
    return '';
  }
  try {
    return decodeURIComponent(className);
  } catch (error) {
    return className;
  }
}

Page({
  data: {
    menuButtonTop: 48,
    menuButtonHeight: 32,
    classId: '',
    className: '',
    students: [],
    showModal: false,
    selectedStudent: null,
    currentDate: '',
    studentCurrentDate: '',
    calendarDefaultDate: 0,
    calendarMinDate: 0,
    calendarMaxDate: 0,
    dateRangeStart: '',
    dateRangeEnd: '',
    attendanceList: [],
    loading: false,
    attendanceSummary: [],
    date: '',
    show: false,
    ec: {
      onInit: initAttendanceChart
    }
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


  async onLoad(options) {
    this.setMenuButtonLayout();
    currentChartPage = this;

    const selectedClass = options && options.classId ? await dataService.getClassById(options.classId) : await dataService.getDefaultClass();
    const currentDate = dataService.getDefaultDate();
    const dateRange = this.getDateRange(currentDate);

    this.setData({
      classId: selectedClass.classId,
      className: options && options.className ? parseClassName(options.className) : selectedClass.name,
      currentDate,
      studentCurrentDate: currentDate,
      calendarDefaultDate: new Date(currentDate).getTime(),
      date: currentDate,
      calendarMinDate: dateRange.calendarMinDate,
      calendarMaxDate: dateRange.calendarMaxDate,
      dateRangeStart: dateRange.dateRangeStart,
      dateRangeEnd: dateRange.dateRangeEnd
    }, () => {
      this.loadStudents();
      this.updateAttendanceSummary();
    });
  },

  onUnload() {
    if (this.attendanceChart) {
      this.attendanceChart.dispose();
      this.attendanceChart = null;
    }

    if (currentChartPage === this) {
      currentChartPage = null;
    }
  },

  onShow() {
    if (this.data.showModal && this.data.selectedStudent) {
      this.updateAttendanceSummary();
      this.fetchAttendance();
    }
  },

  onDisplay() {
    this.setData({
      show: true,
      calendarDefaultDate: new Date(this.data.currentDate).getTime()
    });
  },

  onClose() {
    this.setData({
      show: false
    }, () => {
      this.refreshAttendanceChart();
    });
  },

  onConfirm(event) {
    const selectedDate = this.formatDate(event.detail);
    this.setData({
      show: false,
      date: selectedDate,
      currentDate: selectedDate
    }, () => {
      this.updateAttendanceSummary();
      this.refreshAttendanceChart();
    });
  },

  formatDate(date) {
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getDateRange(baseDate) {
    const maxDate = new Date(baseDate);
    const minDate = new Date(baseDate);
    minDate.setDate(minDate.getDate() - 365);

    return {
      calendarMinDate: minDate.getTime(),
      calendarMaxDate: maxDate.getTime(),
      dateRangeStart: this.formatDate(minDate),
      dateRangeEnd: this.formatDate(maxDate)
    };
  },

  formatTime(dateTimeStr) {
    if (!dateTimeStr) {
      return '';
    }
    const date = new Date(String(dateTimeStr).replace(/-/g, '/').replace('T', ' '));
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  async updateAttendanceSummary() {
    const summary = await dataService.getClassAttendanceSummary(this.data.classId, this.data.currentDate);
    this.setData({
      attendanceSummary: [
        { name: '正常', value: summary.normalRate, color: '#B7EE9F' },
        { name: '迟到', value: summary.lateRate, color: '#F6A39A' },
        { name: '早退', value: summary.earlyLeaveRate, color: '#FFD66B' },
        { name: '缺勤', value: summary.absentRate, color: '#9EB6FF' }
      ]
    }, () => {
      this.refreshAttendanceChart();
    });
  },

  refreshAttendanceChart() {
    wx.nextTick(() => {
      if (this.data.show || this.data.showModal || !this.attendanceChart) {
        return;
      }

      this.attendanceChart.resize();
      this.attendanceChart.setOption(this.getAttendanceChartOption(), true);
    });
  },

  getAttendanceChartOption() {
    const summary = this.data.attendanceSummary.map(item => ({
      value: item.value,
      name: item.name,
      itemStyle: {
        color: item.color
      }
    }));

    return {
      backgroundColor: 'transparent',
      animation: true,
      series: [
        {
          name: '考勤汇总',
          type: 'pie',
          roseType: 'radius',
          radius: ['18%', '72%'],
          center: ['50%', '42%'],
          minAngle: 8,
          startAngle: 90,
          itemStyle: {
            borderColor: '#FFFFFF',
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(111, 190, 101, 0.12)'
          },
          label: {
            show: true,
            color: '#6E8F7A',
            fontSize: 11,
            formatter: '{b}\n{c}%'
          },
          labelLine: {
            length: 10,
            length2: 8,
            lineStyle: {
              color: '#A6B6AD'
            }
          },
          emphasis: {
            scale: false
          },
          data: summary
        }
      ],
      graphic: [
        {
          type: 'group',
          left: 'center',
          top: '90%',
          z: 100,
          silent: true,
          children: [
            {
              type: 'text',
              x: 0,
              y: 0,
              style: {
                text: '考勤汇总',
                fill: '#8BCF7D',
                fontSize: 14,
                fontWeight: '600',
                textAlign: 'center',
                textVerticalAlign: 'middle'
              }
            }
          ]
        }
      ]
    };
  },

  async loadStudents() {
    const classStudents = await dataService.getStudentsByClassId(this.data.classId);
    const students = classStudents.map(student => ({
      id: student.id,
      name: student.name,
      studentNo: student.studentNumber,
      genderText: student.gender === 0 ? '女' : '男',
      gender: student.gender,
      className: student.className,
      photo: student.photo
    }));

    this.setData({
      students
    });
  },

  onTapStudent(e) {
    const student = e.currentTarget.dataset.item;
    if (!student || !student.id) {
      wx.showToast({
        title: '学生信息异常',
        icon: 'none'
      });
      return;
    }

    this.setData({
      selectedStudent: student,
      studentCurrentDate: this.data.studentCurrentDate || this.data.currentDate,
      showModal: true,
      attendanceList: []
    });
    this.fetchAttendance();
  },

  closeModal() {
    this.setData({
      showModal: false
    }, () => {
      this.refreshAttendanceChart();
    });
  },

  noop() {},

  bindDateChange(e) {
    this.setData({
      studentCurrentDate: e.detail.value
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

    wx.navigateTo({
      url: `/pages/teacher/attendance/makeupSign/MakeupSign?studentId=${student.id}&studentName=${encodeURIComponent(student.name || '')}&className=${encodeURIComponent(student.className || this.data.className || '')}&date=${this.data.studentCurrentDate}`
    });
  },

  async fetchAttendance() {
    if (!this.data.selectedStudent || !this.data.selectedStudent.id) {
      return;
    }

    this.setData({
      loading: true
    });

    try {
      const records = await dataService.getAttendanceByStudentId(this.data.selectedStudent.id, this.data.studentCurrentDate);
      const attendanceList = records.map(record => ({
        id: record.id,
        recognizeTime: this.formatTime(record.recognizeTime),
        typeName: record.typeName,
        directionText: record.directionText || (record.direction === 1 ? '进校' : '离校'),
        direction: record.direction,
        statusId: record.statusId,
        statusName: record.statusName
      }));

      this.setData({
        loading: false,
        attendanceList
      });

      if (!attendanceList.length) {
        wx.showToast({
          title: '当日无考勤记录',
          icon: 'none',
          duration: 1500
        });
      }
    } catch (err) {
      this.setData({
        loading: false,
        attendanceList: []
      });
      wx.showToast({
        title: '考勤记录加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  btnBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    wx.switchTab({
      url: '/pages/teacher/main/home/home'
    });
  }
});
