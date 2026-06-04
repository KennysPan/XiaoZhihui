const assert = require('assert');
const dataService = require('../utils/dataService.js');

const classItem = {
  id: '101',
  classId: '101',
  name: '一年级一班'
};
const students = [
  { id: 1, name: '李明', classId: '101', className: '一年级一班', studentNumber: 'S001' },
  { id: 2, name: '王芳', classId: '101', className: '一年级一班', studentNumber: 'S002' },
  { id: 3, name: '赵强', classId: '101', className: '一年级一班', studentNumber: 'S003' }
];
const results = [
  {
    id: 'r1',
    studentId: 1,
    studentName: '李明',
    classId: '101',
    recognizeTime: '2026-06-04 08:00:00',
    direction: 1,
    statusId: 1,
    statusName: '正常'
  },
  {
    id: 'r2',
    studentId: 2,
    studentName: '王芳',
    classId: '101',
    recognizeTime: '2026-06-04 08:28:00',
    direction: 1,
    statusId: 2,
    statusName: '迟到'
  },
  {
    id: 'r3',
    studentId: 1,
    studentName: '李明',
    classId: '101',
    recognizeTime: '2026-06-03 08:00:00',
    direction: 1,
    statusId: 1,
    statusName: '正常'
  }
];

const detail = dataService.__test__.buildClassDailyAttendance(classItem, students, results, '2026-06-04');

assert.strictEqual(detail.className, '一年级一班');
assert.strictEqual(detail.total, 3);
assert.strictEqual(detail.normal, 1);
assert.strictEqual(detail.late, 1);
assert.strictEqual(detail.earlyLeave, 0);
assert.strictEqual(detail.absent, 1);
assert.strictEqual(detail.attendanceRate, 67);
assert.strictEqual(detail.students[0].statusName, '正常');
assert.strictEqual(detail.students[1].statusName, '迟到');
assert.strictEqual(detail.students[2].statusName, '缺勤');
assert.strictEqual(detail.students[0].records.length, 1);

console.log('attendance daily summary ok');
