const assert = require('assert');
const {
  CHILDREN_STORAGE_KEY,
  createMockStudentByIdCard,
  getLocalChildren,
  getStudentFromSearchResponse,
  mergeStudentsByIdentity,
  saveLocalChild
} = require('../pages/parent/add-child/addChildData.js');

const direct = getStudentFromSearchResponse({
  id: 7,
  studentName: '张小明'
});
assert.strictEqual(direct.studentName, '张小明');

const fromItems = getStudentFromSearchResponse({
  items: [
    { id: 8, studentName: '李小红' }
  ]
});
assert.strictEqual(fromItems.id, 8);

const fromNestedData = getStudentFromSearchResponse({
  data: {
    list: [
      { id: 9, name: '王小亮' }
    ]
  }
});
assert.strictEqual(fromNestedData.name, '王小亮');

assert.strictEqual(getStudentFromSearchResponse({ items: [] }), null);

const mockStudent = createMockStudentByIdCard('110101202001011234');
assert.strictEqual(mockStudent.name, '张三');
assert.strictEqual(mockStudent.studentName, '张三');
assert.strictEqual(mockStudent.idCard, '110101202001011234');

const storage = {};
const wxApi = {
  getStorageSync(key) {
    return storage[key];
  },
  setStorageSync(key, value) {
    storage[key] = value;
  }
};

const saved = saveLocalChild(mockStudent, '母亲', wxApi);
assert.strictEqual(saved.name, '张三');
assert.strictEqual(saved.relationName, '母亲');
assert.strictEqual(storage[CHILDREN_STORAGE_KEY].length, 1);

saveLocalChild(createMockStudentByIdCard('110101202001019999'), '父亲', wxApi);
assert.strictEqual(storage[CHILDREN_STORAGE_KEY].length, 1);
assert.strictEqual(getLocalChildren(wxApi)[0].relationName, '父亲');

const merged = mergeStudentsByIdentity(
  [{ id: 1, name: '李四' }],
  [{ id: 1, name: '李四本地' }, { id: 2, name: '张三' }]
);
assert.deepStrictEqual(merged.map(item => item.name), ['李四', '张三']);

console.log('add child data ok');
