const assert = require('assert');
const dataService = require('../utils/dataService.js');

const dictionaries = {
  'attendance-statuses': [
    { value: 1, code: 'NORMAL', name: '正常' },
    { value: 2, code: 'LATE', name: '迟到' }
  ],
  'attendance-directions': [
    { value: 1, code: 'IN', name: '入校' },
    { value: 2, code: 'OUT', name: '离校' }
  ],
  'attendance-methods': [
    { value: 1, code: 'FACE', name: '人脸识别' }
  ],
  'leave-status': [
    { value: 1, code: 'PENDING', name: '待审批' },
    { value: 2, code: 'APPROVED', name: '已通过' }
  ],
  'leave-types': [
    { value: 3, code: 'SICK', name: '病假' }
  ]
};

assert.strictEqual(
  dataService.__test__.resolveDictionaryName(
    dictionaries['attendance-statuses'],
    2,
    '',
    '未知'
  ),
  '迟到'
);

const attendance = dataService.__test__.normalizeAttendanceRecord(
  {
    id: 'r1',
    studentId: 7,
    recognizeTime: '2026-06-04 08:12:00',
    direction: 1,
    resultStatus: 2,
    resultStatusName: '前端旧值',
    methodId: 1
  },
  dictionaries
);

assert.strictEqual(attendance.statusName, '迟到');
assert.strictEqual(attendance.directionText, '入校');
assert.strictEqual(attendance.typeName, '人脸识别');

const attendanceWithoutDirection = dataService.__test__.normalizeAttendanceRecord(
  {
    id: 'r2',
    studentId: 7,
    recognizeTime: '2026-06-04 09:00:00',
    resultStatus: 1
  },
  dictionaries
);

assert.strictEqual(attendanceWithoutDirection.directionText, '');

const leave = dataService.__test__.normalizeLeaveRecord(
  {
    id: 'l1',
    studentName: '李明',
    startTime: '2026-06-04 08:00:00',
    statusId: 1,
    statusName: '前端旧状态',
    typeId: 3,
    typeName: '前端旧类型'
  },
  dictionaries
);

assert.strictEqual(leave.status, '待审批');
assert.strictEqual(leave.type, '病假');

console.log('dictionary mapping ok');
