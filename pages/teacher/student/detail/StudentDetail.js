const dataService = require('../../../../utils/dataService.js');

Page({
  data: {
    studentId: '',
    studentName: '',
    className: '',
    studentGender: '',
    Gender: ''
  },

  async onLoad(options = {}) {
    const students = options.id ? [] : await dataService.getStudents();
    const student = options.id ? await dataService.getStudentById(options.id) : students[0] || {};
    const genderValue = options.studentgender !== undefined ? parseInt(options.studentgender, 10) : student.gender;

    this.setData({
      studentId: options.id || student.id,
      studentName: options.name || student.name,
      className: options.classname || student.className,
      studentGender: genderValue,
      Gender: genderValue === 0 ? '女' : '男'
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
