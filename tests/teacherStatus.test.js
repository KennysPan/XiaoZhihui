const assert = require('assert');
const dataService = require('../utils/dataService.js');

const statusDict = [
  { value: 1, code: 'WORKING', name: '在职' },
  { value: 2, code: 'LEAVE', name: '请假' },
  { value: 3, code: 'QUIT', name: '离职' }
];

const teacher = dataService.__test__.normalizeTeacher(
  {
    id: 101,
    name: '林老师',
    status: 1
  },
  statusDict
);

assert.strictEqual(teacher.statusName, '在职');
assert.strictEqual(teacher.status, 1);

global.wx = {
  getStorageSync(key) {
    if (key === 'teacher_Info') {
      return {
        id: 102,
        name: '王老师',
        status: 2
      };
    }
    if (key === 'teacher_status_dictionary_v1') {
      return statusDict;
    }
    return null;
  }
};

dataService.getTeacherProfile().then(profile => {
  assert.strictEqual(profile.statusName, '请假');
  assert.strictEqual(profile.status, 2);
  console.log('teacher status mapping ok');
});
