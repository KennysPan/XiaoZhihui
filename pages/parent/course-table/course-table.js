const Ext = require('../utils/Ext.js');

Page({
  data: {
    children: [],
    selectedChild: null,
    selectedChildId: null,
    selectedChildIndex: -1,
    weekdays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    coursePeriods: [
      { index: 1, timeRange: '08:00-08:40' },
      { index: 2, timeRange: '08:50-09:30' },
      { index: 3, timeRange: '09:40-10:20' },
      { index: 4, timeRange: '10:30-11:10' },
      { index: 5, timeRange: '11:20-12:00' },
      { index: 6, timeRange: '14:00-14:40' },
      { index: 7, timeRange: '14:50-15:30' },
      { index: 8, timeRange: '15:40-16:20' }
    ],
    courseData: [],
    weekOffset: 0,
    monthOffset: 0,
    tableType: 'week',
    displayRange: '',
    loading: false,
    currentWeekdayIndex: -1,
    currentPeriodIndex: -1,
    timer: null
  },

  onLoad() {
    this.loadChildren();
    this.updateCurrentHighlight();
    this.startTimer();
  },

  onShow() {
    this.updateCurrentHighlight();
  },

  onUnload() {
    this.stopTimer();
  },

  // 加载孩子列表 - 修复接口
  async loadChildren() {
    this.setData({ loading: true });
    try {
      // 使用正确的接口 /api/parents/me
      const res = await Ext.Get(`${Ext.Url}/api/parents/me`);
      console.log('[课程表] 家长信息:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const students = res.data.students || [];
        const children = this.normalizeChildren(students);
        
        this.setData({ children });
        
        if (children.length > 0) {
          this.setData({
            selectedChild: children[0],
            selectedChildId: children[0].studentId,
            selectedChildIndex: 0,
            weekOffset: 0,
            monthOffset: 0,
            tableType: 'week'
          });
          this.loadCourseTable();
        }
      } else {
        this.setData({ children: [], selectedChild: null, selectedChildId: null, selectedChildIndex: -1 });
        wx.showToast({ title: '获取孩子信息失败', icon: 'none' });
      }
    } catch (err) {
      console.error('[课程表] 加载孩子失败:', err);
      this.setData({ children: [], selectedChild: null, selectedChildId: null, selectedChildIndex: -1 });
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  normalizeChildren(students) {
    return (students || []).map((student, index) => {
      const studentId = this.resolveChildStudentId(student);
      const keyId = studentId !== null && studentId !== undefined && studentId !== ''
        ? studentId
        : (student.studentNumber || `child-${index}`);
      return {
        ...student,
        id: keyId,
        studentId,
        uniqueKey: `${keyId}-${index}`,
        name: student.studentName || student.name || '学生',
        className: student.className || student.class || ''
      };
    });
  },

  resolveChildStudentId(student) {
    const keys = ['studentId', 'id', 'childId', 'studentNumber'];
    for (let i = 0; i < keys.length; i++) {
      const value = student[keys[i]];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  },

  selectChild(e) {
    const index = Number(e.currentTarget.dataset.index);
    const child = this.data.children[index];
    if (!child) return;

    this.setData({
      selectedChild: child,
      selectedChildId: child.studentId,
      selectedChildIndex: index,
      weekOffset: 0,
      monthOffset: 0,
      tableType: 'week'
    });
    this.loadCourseTable();
    this.updateCurrentHighlight();
  },

  async loadCourseTable() {
    if (this.data.selectedChildId === null || this.data.selectedChildId === undefined || this.data.selectedChildId === '') return;
    this.setData({ loading: true });
    
    try {
      const { selectedChildId, tableType, weekOffset, monthOffset } = this.data;
      const params = { studentId: selectedChildId };
      
      // 注意：根据API文档，可能需要不同的参数名
      if (tableType === 'week') {
        params.weekOffset = weekOffset;
      } else if (tableType === 'month') {
        params.monthOffset = monthOffset;
      }
      
      const res = await Ext.Get(`${Ext.Url}/api/parent/course-table`, params);
      console.log('[课程表] 课程数据:', res);
      
      if ((res.code === 0 || res.code === 20000) && res.data) {
        const { courseData, type, rangeText } = res.data;
        this.setData({
          courseData: courseData || [],
          tableType: type || 'week',
          displayRange: rangeText || this.getDefaultRange(type)
        });
      } else {
        // 如果接口返回空，显示空课程表
        this.setData({
          courseData: [],
          displayRange: this.getDefaultRange(this.data.tableType)
        });
      }
    } catch (err) {
      console.error('[课程表] 加载课程表失败:', err);
      this.setData({
        courseData: [],
        displayRange: this.getDefaultRange(this.data.tableType)
      });
    } finally {
      this.setData({ loading: false });
      this.updateCurrentHighlight();
    }
  },

  getDefaultRange(type) {
    if (type === 'semester') return '本学期课表';
    if (type === 'month') return this.getMonthRange(this.data.monthOffset);
    return this.getWeekRange(this.data.weekOffset);
  },

  getWeekRange(offset) {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const format = (d) => `${d.getMonth()+1}/${d.getDate()}`;
    return `${format(monday)} - ${format(sunday)}`;
  },

  getMonthRange(offset) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + offset;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const format = (d) => `${d.getMonth()+1}/${d.getDate()}`;
    return `${format(firstDay)} - ${format(lastDay)}`;
  },

  prevPeriod() {
    const { tableType } = this.data;
    if (tableType === 'semester') return;
    if (tableType === 'month') {
      this.setData({ monthOffset: this.data.monthOffset - 1 });
    } else {
      this.setData({ weekOffset: this.data.weekOffset - 1 });
    }
    this.loadCourseTable();
  },

  nextPeriod() {
    const { tableType } = this.data;
    if (tableType === 'semester') return;
    if (tableType === 'month') {
      this.setData({ monthOffset: this.data.monthOffset + 1 });
    } else {
      this.setData({ weekOffset: this.data.weekOffset + 1 });
    }
    this.loadCourseTable();
  },

  updateCurrentHighlight() {
    try {
      const now = new Date();
      let weekDay = now.getDay();
      let weekdayIndex = weekDay === 0 ? 6 : weekDay - 1;

      const currentTime = now.getHours() * 60 + now.getMinutes();
      let periodIndex = -1;
      const periods = this.data.coursePeriods;
      for (let i = 0; i < periods.length; i++) {
        const timeRange = periods[i].timeRange;
        const [startStr, endStr] = timeRange.split('-');
        const startMinutes = this.timeToMinutes(startStr);
        const endMinutes = this.timeToMinutes(endStr);
        if (currentTime >= startMinutes && currentTime <= endMinutes) {
          periodIndex = i;
          break;
        }
      }

      this.setData({
        currentWeekdayIndex: weekdayIndex,
        currentPeriodIndex: periodIndex
      });
    } catch (err) {
      console.error('更新高亮失败', err);
    }
  },

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  },

  startTimer() {
    this.stopTimer();
    const timer = setInterval(() => {
      this.updateCurrentHighlight();
    }, 60000);
    this.setData({ timer });
  },

  stopTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
