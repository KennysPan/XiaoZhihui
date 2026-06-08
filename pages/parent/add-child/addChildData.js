const CHILDREN_STORAGE_KEY = 'mock_children';
const MOCK_ZHANG_SAN_ID = 3001;

function getArrayCandidate(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (!data || typeof data !== 'object') {
    return [];
  }
  if (Array.isArray(data.items)) {
    return data.items;
  }
  if (Array.isArray(data.list)) {
    return data.list;
  }
  if (Array.isArray(data.records)) {
    return data.records;
  }
  if (Array.isArray(data.data)) {
    return data.data;
  }
  if (data.data && typeof data.data === 'object') {
    return getArrayCandidate(data.data);
  }
  return [];
}

function looksLikeStudent(data) {
  return !!(data && typeof data === 'object' && (
    data.id !== undefined
    || data.studentId !== undefined
    || data.studentName
    || data.name
  ));
}

function getStudentFromSearchResponse(data) {
  if (looksLikeStudent(data) && !Array.isArray(data)) {
    return data;
  }

  const students = getArrayCandidate(data);
  return students.length ? students[0] : null;
}

function createMockStudentByIdCard(idCard) {
  return {
    id: MOCK_ZHANG_SAN_ID,
    studentId: MOCK_ZHANG_SAN_ID,
    studentNumber: '2026001',
    studentName: '张三',
    name: '张三',
    className: '三年级一班',
    gradeName: '三年级',
    birthdate: '2016-01-01',
    birthday: '2016-01-01',
    gender: 1,
    genderText: '男',
    statusName: '在读',
    idCard
  };
}

function getLocalChildren(wxApi) {
  const children = wxApi.getStorageSync(CHILDREN_STORAGE_KEY);
  return Array.isArray(children) ? children : [];
}

function saveLocalChild(student, relationName, wxApi) {
  const children = getLocalChildren(wxApi);
  const child = {
    ...student,
    id: student.id || student.studentId || MOCK_ZHANG_SAN_ID,
    studentId: student.studentId || student.id || MOCK_ZHANG_SAN_ID,
    studentNumber: student.studentNumber || String(student.studentId || student.id || MOCK_ZHANG_SAN_ID),
    name: student.name || student.studentName || '张三',
    studentName: student.studentName || student.name || '张三',
    relationName
  };
  const index = children.findIndex(item => (
    item.id === child.id
    || item.studentId === child.studentId
    || item.studentNumber === child.studentNumber
  ));

  if (index >= 0) {
    children[index] = { ...children[index], ...child };
  } else {
    children.push(child);
  }

  wxApi.setStorageSync(CHILDREN_STORAGE_KEY, children);
  return child;
}

function getStudentIdentity(student) {
  if (!student || typeof student !== 'object') {
    return '';
  }
  return String(
    student.id
    || student.studentId
    || student.studentNumber
    || student.idCard
    || student.name
    || student.studentName
    || ''
  );
}

function mergeStudentsByIdentity(remoteStudents, localStudents) {
  const merged = Array.isArray(remoteStudents) ? [...remoteStudents] : [];
  const used = new Set(merged.map(getStudentIdentity).filter(Boolean));
  const local = Array.isArray(localStudents) ? localStudents : [];

  local.forEach(student => {
    const identity = getStudentIdentity(student);
    if (!identity || used.has(identity)) {
      return;
    }
    used.add(identity);
    merged.push(student);
  });

  return merged;
}

module.exports = {
  CHILDREN_STORAGE_KEY,
  createMockStudentByIdCard,
  getLocalChildren,
  mergeStudentsByIdentity,
  saveLocalChild,
  getStudentFromSearchResponse
};
