const assert = require('assert');

let capturedPage = null;
global.Page = config => {
  capturedPage = config;
};

require('../pages/teacher/attendance/attendance/Attendance.js');

assert.ok(capturedPage, 'Attendance page should register with Page()');
assert.strictEqual(typeof capturedPage.onTapClass, 'function');
assert.strictEqual(typeof capturedPage.onTapStudent, 'function');

const page = {
  data: {
    selectedClassDetail: null,
    selectedStudentDetail: null,
    showClassModal: false
  },
  setData(patch) {
    this.data = {
      ...this.data,
      ...patch
    };
  }
};

const classDetail = {
  classId: '101',
  className: '一年级一班',
  students: [
    {
      id: 1,
      name: '李明',
      records: [
        { id: 'r1', time: '08:00', directionText: '进校' }
      ]
    }
  ]
};

capturedPage.onTapClass.call(page, {
  currentTarget: {
    dataset: {
      class: classDetail
    }
  }
});

assert.strictEqual(page.data.showClassModal, true);
assert.strictEqual(page.data.selectedClassDetail.className, '一年级一班');
assert.strictEqual(page.data.selectedStudentDetail, null);

capturedPage.onTapStudent.call(page, {
  currentTarget: {
    dataset: {
      student: classDetail.students[0]
    }
  }
});

assert.strictEqual(page.data.selectedStudentDetail.name, '李明');
assert.strictEqual(page.data.selectedStudentDetail.records[0].time, '08:00');

console.log('attendance page flow ok');
