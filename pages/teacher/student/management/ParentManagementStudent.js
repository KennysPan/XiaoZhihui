const dataService = require('../../../../utils/dataService.js');

Page({
  data: {
    menuButtonTop: 48,
    menuButtonHeight: 32,
    className: '',
    tName: '',
    role: '',
    studentList: [],
    filteredStudentList: [],
    classOptions: [],
    selectedClassIndex: 0
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
    let studentList = await dataService.getStudents();
    let className = '';

    if (options.studentList) {
      try {
        studentList = JSON.parse(decodeURIComponent(options.studentList));
      } catch (e) {}
    } else if (options.classId) {
      studentList = await dataService.getStudentsByClassId(options.classId);
      const classInfo = await dataService.getClassById(options.classId);
      className = classInfo.name;
    }

    if (!className && options.className) {
      className = decodeURIComponent(options.className);
    }

    if (!className && studentList.length > 0) {
      const firstClassName = studentList[0].className;
      const isSingleClass = studentList.every(item => item.className === firstClassName);
      className = isSingleClass ? firstClassName : '所教班级';
    }

    const classOptions = this.getClassOptions(studentList);

    this.setData({
      className,
      studentList,
      filteredStudentList: studentList,
      classOptions,
      tName: options.tName ? decodeURIComponent(options.tName) : teacher.name
    });
  },

  getClassOptions(studentList = []) {
    const classNames = Array.from(new Set(studentList.map(item => item.className).filter(Boolean)));
    return ['全部班级'].concat(classNames);
  },

  onClassChange(e) {
    const selectedClassIndex = Number(e.detail.value);
    const selectedClassName = this.data.classOptions[selectedClassIndex];
    const filteredStudentList = selectedClassName === '全部班级'
      ? this.data.studentList
      : this.data.studentList.filter(item => item.className === selectedClassName);

    this.setData({
      selectedClassIndex,
      filteredStudentList
    });
  },

  btnBack() {
    wx.navigateBack();
  },

  goToDetail(e) {
    const ds = e.currentTarget.dataset;
    const id = ds.id;
    const name = ds.name;
    const classname = ds.classname;
    const studentGender = ds.gender;

    if (id === undefined || name === undefined) {
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/teacher/student/detail/StudentDetail?id=${id}&name=${name}&classname=${classname}&studentgender=${studentGender}`
    });
  }
});
