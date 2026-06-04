const mockData = require('./mockData.js');
const Ext = require('./Ext.js');

const SUCCESS_CODES = [0, 200, 20000];
const SESSION_RESPONSE_STORAGE_KEY = 'session_response';
const TEACHER_CLASSES_STORAGE_KEY = 'teacher_class_list';
const ANNOUNCEMENT_STORAGE_KEY = 'home_announcement_records_v2';
const LEAVE_RECORD_STORAGE_KEY = 'teacher_leave_records_v2';
const TEACHER_STATUS_DICT_STORAGE_KEY = 'teacher_status_dictionary_v1';
const DICTIONARY_STORAGE_PREFIX = 'dictionary_';
const DEFAULT_DICTIONARIES = {
  'teacher-statuses': [
    { value: 1, code: 'WORKING', name: '在职' },
    { value: 2, code: 'LEAVE', name: '请假' },
    { value: 3, code: 'QUIT', name: '离职' }
  ],
  'attendance-statuses': [
    { value: 1, code: 'NORMAL', name: '正常' },
    { value: 2, code: 'LATE', name: '迟到' },
    { value: 3, code: 'EARLY_LEAVE', name: '早退' },
    { value: 4, code: 'ABSENT', name: '缺勤' },
    { value: 5, code: 'OUT', name: '外出' },
    { value: 6, code: 'LEAVE', name: '请假' },
    { value: 7, code: 'MAKEUP', name: '补卡' },
    { value: 8, code: 'RETURN', name: '返校' },
    { value: 9, code: 'STAY', name: '住宿' },
    { value: 11, code: 'HOLIDAY', name: '节假日' },
    { value: 12, code: 'UNKNOWN', name: '未知' }
  ],
  'attendance-directions': [
    { value: 1, code: 'IN', name: '进校' },
    { value: 2, code: 'OUT', name: '离校' }
  ],
  'attendance-methods': [],
  'leave-status': [],
  'leave-types': [],
  'student-statuses': []
};
const DEFAULT_TEACHER_STATUS_DICT = DEFAULT_DICTIONARIES['teacher-statuses'];

function isSuccess(response) {
  return response && SUCCESS_CODES.includes(Number(response.code));
}

function getApiMessage(response, fallback = '请求失败') {
  return response && response.message ? response.message : fallback;
}

function isTokenExpiredResponse(response) {
  return response && Number(response.code) === 401;
}

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function maskLogValue(value) {
  const text = String(value || '');
  if (!text) {
    return '';
  }
  if (text.length <= 12) {
    return '***';
  }
  return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  return Object.keys(data).reduce((result, key) => {
    const value = data[key];
    const lowerKey = key.toLowerCase();
    if (lowerKey.indexOf('password') !== -1 || lowerKey.indexOf('token') !== -1) {
      result[key] = maskLogValue(value);
      return result;
    }
    result[key] = value && typeof value === 'object' ? sanitizeLogData(value) : value;
    return result;
  }, {});
}

function getStoredAnnouncements() {
  try {
    const records = wx.getStorageSync(ANNOUNCEMENT_STORAGE_KEY);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    return [];
  }
}

function getStoredLeaveRecords() {
  try {
    const records = wx.getStorageSync(LEAVE_RECORD_STORAGE_KEY);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    return [];
  }
}

function unwrapData(response) {
  if (!isSuccess(response)) {
    throw new Error(getApiMessage(response));
  }
  return response.data;
}

function getDictionaryStorageKey(code) {
  return `${DICTIONARY_STORAGE_PREFIX}${code}_v1`;
}

function getDefaultDictionary(code) {
  return DEFAULT_DICTIONARIES[code] || [];
}

function normalizeDictionaryRecords(data, code) {
  const fallback = getDefaultDictionary(code);
  if (!Array.isArray(data)) {
    return fallback;
  }
  const records = data.filter(item => item && item.disabled !== true);
  return records.length ? records : fallback;
}

function getStoredDictionary(code) {
  const fallback = getDefaultDictionary(code);
  try {
    const records = wx.getStorageSync(getDictionaryStorageKey(code));
    if (Array.isArray(records) && records.length) {
      return records;
    }

    if (code === 'teacher-statuses') {
      const legacyRecords = wx.getStorageSync(TEACHER_STATUS_DICT_STORAGE_KEY);
      if (Array.isArray(legacyRecords) && legacyRecords.length) {
        return legacyRecords;
      }
    }
  } catch (error) {}
  return fallback;
}

function saveDictionary(code, records) {
  try {
    wx.setStorageSync(getDictionaryStorageKey(code), records);
    if (code === 'teacher-statuses') {
      wx.setStorageSync(TEACHER_STATUS_DICT_STORAGE_KEY, records);
    }
  } catch (error) {}
}

function fetchDictionary(code) {
  return apiGet(`/API/commons/dictionaries/${code}`)
    .then(unwrapData)
    .then(data => {
      const records = normalizeDictionaryRecords(data, code);
      saveDictionary(code, records);
      return records;
    })
    .catch(error => {
      console.error(`字典加载失败: ${code}`, error);
      return getStoredDictionary(code);
    });
}

function fetchDictionaries(codes = []) {
  return Promise.all(codes.map(code => fetchDictionary(code).then(records => [code, records])))
    .then(entries => entries.reduce((result, [code, records]) => {
      result[code] = records;
      return result;
    }, {}));
}

function getDictionary(dictionaries = {}, code) {
  if (Array.isArray(dictionaries)) {
    return dictionaries;
  }
  if (dictionaries && Array.isArray(dictionaries[code])) {
    return dictionaries[code];
  }
  return getStoredDictionary(code);
}

function resolveDictionaryName(dict = [], value, text = '', fallback = '') {
  const normalizedText = text === undefined || text === null ? '' : String(text);
  const matched = (Array.isArray(dict) ? dict : []).find(item => {
    if (!item) {
      return false;
    }
    return (
      String(item.value) === String(value)
      || String(item.code) === String(value)
      || String(item.code) === normalizedText
      || String(item.name) === normalizedText
    );
  });

  if (matched && matched.name) {
    return matched.name;
  }

  return normalizedText || fallback;
}

function getStoredTeacherStatusDict() {
  try {
    const records = getStoredDictionary('teacher-statuses');
    return Array.isArray(records) && records.length ? records : DEFAULT_TEACHER_STATUS_DICT;
  } catch (error) {
    return DEFAULT_TEACHER_STATUS_DICT;
  }
}

function fetchTeacherStatusDict() {
  return fetchDictionary('teacher-statuses');
}

function buildUrl(path, params = {}) {
  const query = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  const url = `${Ext.Url}${path}`;
  return query ? `${url}?${query}` : url;
}

function apiRequest(method, path, options = {}) {
  const data = options.data || {};
  const params = options.params || {};
  const url = method === 'GET' ? buildUrl(path, params) : `${Ext.Url}${path}`;

  console.log('[接口请求]', {
    method,
    url,
    ...(method === 'GET' ? { params: sanitizeLogData(params) } : { data: sanitizeLogData(data) })
  });

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      header: Ext.getAuthHeader(),
      data: method === 'GET' ? undefined : data,
      success: (res) => {
        console.log('[接口响应]', {
          method,
          url,
          statusCode: res.statusCode,
          data: sanitizeLogData(res.data)
        });

        if (res.statusCode === 401 || isTokenExpiredResponse(res.data)) {
          Ext.handleTokenExpired();
          reject(new Error('token失效重新选择登录'));
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        const message = res.data && res.data.message ? res.data.message : `HTTP错误: ${res.statusCode}`;
        const error = new Error(`${message} (${url})`);
        error.statusCode = res.statusCode;
        error.url = url;
        error.data = res.data;
        reject(error);
      },
      fail: (err) => {
        console.error('[接口失败]', {
          method,
          url,
          error: err
        });
        reject(err);
      }
    });
  });
}

function apiGet(path, params = {}) {
  return apiRequest('GET', path, { params });
}

function apiPost(path, data = {}) {
  return apiRequest('POST', path, { data });
}

function unwrapItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}

function toDateOnly(value) {
  if (!value) {
    return '';
  }
  return String(value).replace('T', ' ').slice(0, 10);
}

function toDateTime(date, time) {
  return `${date} ${time}:00`;
}

function getGenderValue(item = {}) {
  if (item.genderText && item.genderText.indexOf('女') !== -1) {
    return 0;
  }
  if (Number(item.gender) === 2 || Number(item.genderId) === 2) {
    return 0;
  }
  return 1;
}

function normalizeClass(item = {}, index = 0) {
  const id = item.id || item.classId || '';
  const name = item.name || item.className || '未命名班级';
  const colors = ['#74E2B6', '#FFB6C1', '#87CEEB', '#FFD66B', '#9EB6FF'];

  return {
    ...item,
    id,
    classId: String(id),
    name,
    className: name,
    courseName: item.courseName || item.mainCourseName || '',
    studentCount: item.studentCount || item.studentsCount || item.studentTotal || 0,
    gradeName: item.gradeName || '',
    roomNo: item.roomNo || item.roomNumber || item.location || '',
    bgColor: item.bgColor || colors[index % colors.length]
  };
}

function normalizeStudent(item = {}) {
  const id = item.id || item.studentId || '';

  return {
    ...item,
    id,
    name: item.name || item.studentName || '未命名学生',
    gender: getGenderValue(item),
    genderText: item.genderText || (getGenderValue(item) === 0 ? '女' : '男'),
    classId: String(item.classId || ''),
    className: item.className || '',
    studentNumber: item.studentNumber || item.studentNo || '',
    photo: item.photo || item.avatarUrl || item.avatar || ''
  };
}

function normalizeAnnouncement(item = {}) {
  const publishTime = item.publishTime || item.createdTime || item.updatedTime || '';
  const title = item.title || item.name || '未命名公告';

  return {
    ...item,
    id: item.id || `announcement-${title}-${publishTime}`,
    title,
    content: item.content || item.description || '',
    publisher: item.publisherName || item.publisher || item.publisherUserName || '学校通知',
    time: publishTime,
    typeName: item.typeName || '',
    statusText: item.statusText || '',
    topLevel: Number(item.topLevel || 0),
    readCount: Number(item.readCount || 0),
    attachments: Array.isArray(item.attachments) ? item.attachments : []
  };
}

function getLeaveStatusText(item = {}, dictionaries = {}) {
  const statusId = item.statusId || item.status || item.approvalStatus || '';
  const text = item.statusName || item.statusText || item.status || '';
  const dictionaryText = resolveDictionaryName(getDictionary(dictionaries, 'leave-status'), statusId, text, '');
  if (dictionaryText) {
    return dictionaryText;
  }

  if (text) {
    if (String(text).indexOf('通过') !== -1 || String(text).indexOf('批准') !== -1) {
      return '已通过';
    }
    if (String(text).indexOf('驳回') !== -1 || String(text).indexOf('拒绝') !== -1) {
      return '已驳回';
    }
    if (String(text).indexOf('待') !== -1 || String(text).indexOf('未') !== -1 || String(text).indexOf('审批') !== -1) {
      return '未处理';
    }
    return String(text);
  }

  const numericStatusId = Number(statusId || 0);
  if (numericStatusId === 1) {
    return '已通过';
  }
  if (numericStatusId === 2) {
    return '已驳回';
  }
  return '未处理';
}

function normalizeLeaveRecord(item = {}, dictionaries = {}) {
  const startTime = item.startTime || item.beginTime || item.date || item.createdTime || '';
  const endTime = item.endTime || item.finishTime || '';
  const student = item.student || {};
  const approver = item.approver || {};
  const status = getLeaveStatusText(item, dictionaries);
  const teacher = item.approverName || item.teacherName || approver.name || '';
  const typeId = item.typeId || item.leaveTypeId || item.type || '';
  const typeText = item.typeName || item.leaveTypeName || item.type || '';
  const type = resolveDictionaryName(getDictionary(dictionaries, 'leave-types'), typeId, typeText, '');

  return {
    ...item,
    isFromApi: true,
    id: item.id || item.recordId || item.leaveId || '',
    studentId: item.studentId || student.id || '',
    name: item.studentName || item.name || student.name || '未知学生',
    date: startTime,
    endTime,
    status,
    statusId: item.statusId || item.status || item.approvalStatus || 0,
    type,
    typeId,
    teacher: status === '未处理' ? '' : teacher,
    reason: item.reason || item.remark || '',
    approverRemark: item.approverRemark || ''
  };
}

function isPublishedAnnouncement(item = {}) {
  if (item.status === undefined && !item.statusText) {
    return true;
  }

  return Number(item.status) === 1 || String(item.statusText || '').indexOf('已发布') !== -1;
}

function getAnnouncementTimeValue(item = {}) {
  const time = item.publishTime || item.time || item.createdTime || '';
  const timestamp = new Date(String(time).replace(/-/g, '/')).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getDirectionText(direction, directionName, dictionaries = {}) {
  if (!direction && !directionName) {
    return '';
  }

  return resolveDictionaryName(
    getDictionary(dictionaries, 'attendance-directions'),
    direction,
    directionName,
    ''
  );
}

function normalizeAttendanceRecord(item = {}, dictionaries = {}) {
  const direction = Number(item.direction || 0);
  const recognizeTime = item.recognizeTime
    || item.recordTime
    || item.attendanceTime
    || item.attendanceDate
    || item.recordDate
    || item.createdTime
    || '';
  const statusId = item.statusId || item.resultStatus || item.status || 0;
  const statusText = item.statusName || item.resultStatusName || item.statusText || '';
  const statusName = resolveDictionaryName(
    getDictionary(dictionaries, 'attendance-statuses'),
    statusId,
    statusText,
    ''
  );
  const methodId = item.methodId || item.attendanceMethodId || item.method || '';
  const methodText = item.typeName || item.methodName || item.methodText || '';
  const typeName = resolveDictionaryName(
    getDictionary(dictionaries, 'attendance-methods'),
    methodId,
    methodText,
    '考勤'
  );

  return {
    ...item,
    id: item.id || `${item.studentId || ''}-${recognizeTime}`,
    studentId: item.studentId || '',
    studentName: item.studentName || '',
    recognizeTime,
    recordDate: item.recordDate || item.attendanceDate || toDateOnly(recognizeTime),
    typeName,
    direction,
    directionText: getDirectionText(direction, item.directionName || item.directionText || '', dictionaries),
    statusId,
    statusName,
    deviceName: item.deviceName || '',
    location: item.location || ''
  };
}

function getAttendanceStatusType(item = {}) {
  const name = item.resultStatusName || item.statusName || '';
  const status = Number(item.resultStatus || item.statusId || 0);

  if (name.indexOf('早退') !== -1 || status === 3) {
    return 'earlyLeave';
  }
  if (name.indexOf('迟到') !== -1 || status === 2) {
    return 'late';
  }
  if (name.indexOf('缺勤') !== -1 || name.indexOf('旷') !== -1 || status === 4) {
    return 'absent';
  }
  return 'normal';
}

function getDailyStudentStatus(records = [], dictionaries = {}) {
  const attendanceStatusDict = getDictionary(dictionaries, 'attendance-statuses');
  if (!records.length) {
    return {
      statusType: 'absent',
      statusName: resolveDictionaryName(attendanceStatusDict, 4, '', '缺勤')
    };
  }

  const types = records.map(getAttendanceStatusType);
  if (types.includes('absent')) {
    return {
      statusType: 'absent',
      statusName: resolveDictionaryName(attendanceStatusDict, 4, '', '缺勤')
    };
  }
  if (types.includes('late')) {
    return {
      statusType: 'late',
      statusName: resolveDictionaryName(attendanceStatusDict, 2, '', '迟到')
    };
  }
  if (types.includes('earlyLeave')) {
    return {
      statusType: 'earlyLeave',
      statusName: resolveDictionaryName(attendanceStatusDict, 3, '', '早退')
    };
  }
  return {
    statusType: 'normal',
    statusName: resolveDictionaryName(attendanceStatusDict, 1, '', '正常')
  };
}

function getRecordDateValue(item = {}) {
  return toDateOnly(item.recordDate || item.attendanceDate || item.recognizeTime || item.createdTime || '');
}

function getRecordTimeValue(item = {}) {
  const value = item.recognizeTime || item.recordTime || item.attendanceTime || '';
  const date = new Date(String(value).replace(/-/g, '/').replace('T', ' '));
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function buildClassDailyAttendance(classItem = {}, students = [], results = [], date = getDefaultDate(), dictionaries = {}) {
  const normalizedStudents = students.map(normalizeStudent);
  const classId = String(classItem.classId || classItem.id || '');
  const className = classItem.name || classItem.className || '未命名班级';
  const records = results
    .map(item => normalizeAttendanceRecord(item, dictionaries))
    .filter(item => !date || getRecordDateValue(item) === date)
    .filter(item => !classId || !item.classId || String(item.classId) === classId)
    .sort((a, b) => {
      const aTime = new Date(String(a.recognizeTime || '').replace(/-/g, '/')).getTime();
      const bTime = new Date(String(b.recognizeTime || '').replace(/-/g, '/')).getTime();
      return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
    });
  const recordsByStudent = {};

  records.forEach(record => {
    const studentId = String(record.studentId || '');
    if (!recordsByStudent[studentId]) {
      recordsByStudent[studentId] = [];
    }
    recordsByStudent[studentId].push({
      ...record,
      time: getRecordTimeValue(record),
      directionText: record.directionText || (record.direction === 1 ? '进校' : '离校')
    });
  });

  const studentDetails = normalizedStudents.map(student => {
    const studentRecords = recordsByStudent[String(student.id)] || recordsByStudent[String(student.studentId)] || [];
    const status = getDailyStudentStatus(studentRecords, dictionaries);
    return {
      ...student,
      ...status,
      records: studentRecords
    };
  });
  const summary = {
    normal: 0,
    late: 0,
    earlyLeave: 0,
    absent: 0
  };

  studentDetails.forEach(student => {
    summary[student.statusType] += 1;
  });

  const total = studentDetails.length;
  const denominator = total || 1;

  return {
    classId,
    className,
    date,
    total,
    normal: summary.normal,
    late: summary.late,
    earlyLeave: summary.earlyLeave,
    absent: summary.absent,
    attendanceRate: Math.round(((summary.normal + summary.late + summary.earlyLeave) / denominator) * 100),
    students: studentDetails,
    records
  };
}

function getTeacherClassRefs(teacher = wx.getStorageSync('teacher_Info') || {}) {
  return Array.isArray(teacher.teachingClasses) ? teacher.teachingClasses : [];
}

function getClassIdFromRef(item) {
  if (item === null || item === undefined) {
    return '';
  }
  if (typeof item === 'number' || typeof item === 'string') {
    return String(item);
  }
  return String(item.id || item.classId || '');
}

function getTeacherClassIds(teacher) {
  return getTeacherClassRefs(teacher)
    .map(getClassIdFromRef)
    .filter(Boolean);
}

function getCachedTeacherClasses() {
  try {
    const classes = wx.getStorageSync(TEACHER_CLASSES_STORAGE_KEY);
    return Array.isArray(classes) ? classes : [];
  } catch (error) {
    return [];
  }
}

function saveTeacherClasses(classes = []) {
  wx.setStorageSync(TEACHER_CLASSES_STORAGE_KEY, classes);
  const teacher = wx.getStorageSync('teacher_Info') || {};
  wx.setStorageSync('teacher_Info', {
    ...teacher,
    managedClass: classes.map(item => item.name).filter(Boolean).join('、')
  });
}

function fetchClassById(classId) {
  return apiGet(`/api/classes/${classId}`)
    .then(unwrapData)
    .then(data => normalizeClass(data));
}

function fetchStudentsByClassId(classId) {
  return apiGet('/api/students', { ClassId: classId })
    .then(unwrapData)
    .then(data => unwrapItems(data).map(normalizeStudent));
}

function login(loginKey, password) {
  const url = `${Ext.Url}/api/sessions`;
  const data = {
    LoginKey: loginKey,
    Password: password,
    password
  };

  console.log('[接口请求]', {
    method: 'POST',
    url,
    data: sanitizeLogData(data)
  });

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data,
      success: (res) => {
        console.log('[接口响应]', {
          method: 'POST',
          url,
          statusCode: res.statusCode,
          data: sanitizeLogData(res.data)
        });
        const response = res.data;
        if (!isSuccess(response)) {
          reject(new Error(getApiMessage(response, '账号或密码不正确')));
          return;
        }

        const sessionData = response.data || {};
        wx.setStorageSync(SESSION_RESPONSE_STORAGE_KEY, response);
        wx.setStorageSync('session_data', sessionData);
        if (sessionData.accessToken) {
          wx.setStorageSync('accessToken', String(sessionData.accessToken).trim());
          wx.setStorageSync('tokenType', 'Bearer');
        }
        Ext.saveToken(sessionData);

        if (sessionData.user) {
          wx.setStorageSync('user_info', sessionData.user);
        }

        resolve(sessionData);
      },
      fail: (err) => {
        console.error('[接口失败]', {
          method: 'POST',
          url,
          error: err
        });
        reject(err);
      }
    });
  });
}

function getTeacherStatusValue(item = {}) {
  if (item.statusId !== undefined && item.statusId !== null && item.statusId !== '') {
    return item.statusId;
  }
  if (item.status !== undefined && item.status !== null && item.status !== '') {
    return item.status;
  }
  if (item.teacherStatusId !== undefined && item.teacherStatusId !== null && item.teacherStatusId !== '') {
    return item.teacherStatusId;
  }
  return item.teacherStatus || '';
}

function resolveTeacherStatusName(item = {}, statusDict = DEFAULT_TEACHER_STATUS_DICT) {
  const statusValue = getTeacherStatusValue(item);
  const statusText = item.statusName || item.statusText || item.statusCode || '';
  const normalizedDict = Array.isArray(statusDict) && statusDict.length ? statusDict : DEFAULT_TEACHER_STATUS_DICT;
  return resolveDictionaryName(normalizedDict, statusValue, statusText, '在职');
}

function normalizeTeacher(item = {}, statusDict = DEFAULT_TEACHER_STATUS_DICT) {
  const teachingClasses = Array.isArray(item.teachingClasses) ? item.teachingClasses : [];
  const managedClass = teachingClasses
    .map(item => (typeof item === 'object' ? (item.name || item.className) : ''))
    .filter(Boolean)
    .join('、');
  const statusValue = getTeacherStatusValue(item);

  return {
    ...item,
    id: item.id || item.teacherId || item.userId || '',
    name: item.name || item.teacherName || item.userName || '教师',
    status: statusValue,
    statusName: resolveTeacherStatusName(item, statusDict),
    email: item.email || '',
    joinDate: item.joinDate || item.enrollmentDate || item.createdTime || '',
    school: item.schoolName || item.school || '',
    department: item.departmentName || item.department || '',
    managedClass: managedClass || item.managedClass || '',
    duty: item.duty || (item.isHeadTeacher ? '班主任' : '教师')
  };
}

function getCurrentTeacher() {
  return Ext.Get(`${Ext.Url}/api/teachers/me`)
    .then(response => {
      if (!isSuccess(response)) {
        throw new Error(getApiMessage(response, '教师信息获取失败'));
      }

      return fetchTeacherStatusDict().then(statusDict => {
        const teacher = normalizeTeacher(response.data || {}, statusDict);
        wx.setStorageSync('teacher_Info', teacher);
        return teacher;
      });
    });
}

function initializeAppState() {
  return getCurrentTeacher().then(teacher => getClasses(teacher).then(() => {
    wx.setStorageSync('user_role', wx.getStorageSync('user_role') || 3);
    return wx.getStorageSync('teacher_Info') || teacher;
  }));
}

function getCurrentUser() {
  return Promise.resolve(wx.getStorageSync('user_info') || null);
}

function getTeacherProfile() {
  const storedTeacher = wx.getStorageSync('teacher_Info');
  const teacher = storedTeacher || mockData.getTeacherProfile();
  const statusDict = storedTeacher ? getStoredTeacherStatusDict() : DEFAULT_TEACHER_STATUS_DICT;
  return Promise.resolve(normalizeTeacher(teacher, statusDict));
}

function getTeacherById() {
  return getTeacherProfile();
}

function getLoginAccount() {
  return {
    loginKey: '',
    phone: '',
    password: '',
    role: 3
  };
}

function getClasses(teacher) {
  const targetTeacher = teacher || wx.getStorageSync('teacher_Info') || {};
  const classRefs = getTeacherClassRefs(targetTeacher);
  const objectClasses = classRefs
    .filter(item => item && typeof item === 'object')
    .map(normalizeClass);
  const classIds = getTeacherClassIds(targetTeacher);

  if (!classIds.length && objectClasses.length) {
    saveTeacherClasses(objectClasses);
    return Promise.resolve(objectClasses);
  }

  if (!classIds.length) {
    const cachedClasses = getCachedTeacherClasses();
    if (cachedClasses.length) {
      return Promise.resolve(cachedClasses);
    }
    return Promise.resolve(mockData.getClasses());
  }

  return Promise.all(classIds.map(fetchClassById))
    .then(classes => classes.map(normalizeClass))
    .then(classes => {
      saveTeacherClasses(classes);
      return classes;
    })
    .catch(error => {
      console.error('所教班级加载失败', error);
      const cachedClasses = getCachedTeacherClasses();
      if (cachedClasses.length) {
        return cachedClasses;
      }
      const fallbackClasses = classIds.map((classId, index) => normalizeClass({
        id: classId,
        name: `班级${classId}`
      }, index));
      saveTeacherClasses(fallbackClasses);
      return fallbackClasses;
    });
}

function getDefaultClass() {
  return getClasses().then(classes => classes[0] || mockData.getDefaultClass());
}

function getClassById(classId) {
  const cached = getCachedTeacherClasses().find(item => String(item.classId) === String(classId));
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetchClassById(classId).catch(() => mockData.getClassById(classId));
}

function getStudents() {
  return getClasses()
    .then(classes => Promise.all(classes.map(item => fetchStudentsByClassId(item.classId))))
    .then(list => list.flat())
    .catch(error => {
      console.error('所教班级学生加载失败', error);
      return [];
    });
}

function getStudentsByClassId(classId) {
  return fetchStudentsByClassId(classId).catch(() => []);
}

function getStudentById(studentId) {
  return Promise.resolve(mockData.getStudentById(studentId));
}

function getAnnouncements() {
  return apiGet('/api/announcements')
    .then(unwrapData)
    .then(data => unwrapItems(data)
      .filter(isPublishedAnnouncement)
      .sort((a, b) => {
        const topDiff = Number(b.topLevel || 0) - Number(a.topLevel || 0);
        return topDiff || getAnnouncementTimeValue(b) - getAnnouncementTimeValue(a);
      })
      .map(normalizeAnnouncement))
    .then(announcements => {
      wx.setStorageSync(ANNOUNCEMENT_STORAGE_KEY, announcements);
      return announcements;
    })
    .catch(error => {
      console.error('公告加载失败', error);
      return getStoredAnnouncements();
    });
}

function getDefaultDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAttendanceByStudentId(studentId, date) {
  return Promise.all([
    fetchDictionaries(['attendance-statuses', 'attendance-directions', 'attendance-methods']),
    apiGet('/api/attendances/results', {
      StudentId: studentId,
      AttendanceDate: date,
      PageSize: 100
    }).then(unwrapData)
  ])
    .then(([dictionaries, data]) => unwrapItems(data)
      .map(item => normalizeAttendanceRecord(item, dictionaries))
      .filter(item => String(item.studentId) === String(studentId))
      .filter(item => !date || toDateOnly(item.recordDate || item.recognizeTime) === date)
      .sort((a, b) => new Date(a.recognizeTime.replace(/-/g, '/')) - new Date(b.recognizeTime.replace(/-/g, '/'))))
    .catch(error => {
      console.error('考勤记录加载失败', error);
      return [];
    });
}

function getClassAttendanceSummary(classId, date) {
  return Promise.all([
    getStudentsByClassId(classId),
    apiGet('/api/attendances/results', {
      ClassId: classId,
      AttendanceDate: date,
      PageSize: 200
    }).then(unwrapData).then(unwrapItems)
  ])
    .then(([students, results]) => {
      const classResults = results.filter(item => (
        String(item.classId || '') === String(classId || '')
        && (!date || toDateOnly(item.attendanceDate || item.recordDate || item.createdTime) === date)
      ));
      const resultByStudent = {};

      classResults.forEach(item => {
        resultByStudent[String(item.studentId)] = item;
      });

      const total = Math.max(students.length, classResults.length);
      const summary = {
        normal: 0,
        late: 0,
        earlyLeave: 0,
        absent: 0
      };

      students.forEach(student => {
        const result = resultByStudent[String(student.id)];
        if (!result) {
          summary.absent += 1;
          return;
        }
        summary[getAttendanceStatusType(result)] += 1;
      });

      if (!students.length) {
        classResults.forEach(item => {
          summary[getAttendanceStatusType(item)] += 1;
        });
      }

      const denominator = total || 1;
      return {
        attendanceRate: Math.round(((summary.normal + summary.late + summary.earlyLeave) / denominator) * 100),
        lateRate: Math.round((summary.late / denominator) * 100),
        earlyLeaveRate: Math.round((summary.earlyLeave / denominator) * 100),
        normalRate: Math.round((summary.normal / denominator) * 100),
        absentRate: Math.round((summary.absent / denominator) * 100)
      };
    })
    .catch(error => {
      console.error('班级考勤汇总加载失败', error);
      return {
        attendanceRate: 0,
        lateRate: 0,
        earlyLeaveRate: 0,
        normalRate: 0,
        absentRate: 0
      };
    });
}

function getClassDailyAttendance(classItem, date) {
  const classId = classItem.classId || classItem.id || '';
  return Promise.all([
    getStudentsByClassId(classId),
    fetchDictionaries(['attendance-statuses', 'attendance-directions', 'attendance-methods']),
    apiGet('/api/attendances/results', {
      ClassId: classId,
      AttendanceDate: date,
      PageSize: 500
    })
      .then(unwrapData)
      .then(unwrapItems)
      .catch(error => {
        console.error('班级考勤记录加载失败', error);
        return [];
      })
  ])
    .then(([students, dictionaries, results]) => buildClassDailyAttendance(classItem, students, results, date, dictionaries))
    .catch(error => {
      console.error('班级逐日考勤加载失败', error);
      return buildClassDailyAttendance(classItem, [], [], date);
    });
}

function getMakeupPeriodTime(periodKey) {
  const map = {
    morning: { time: '08:00', direction: 1 },
    noon: { time: '12:30', direction: 1 },
    evening: { time: '18:00', direction: 2 }
  };
  return map[periodKey] || map.morning;
}

function findMatchingAttendanceRecord(records, target) {
  const targetTime = target.RecognizeTime;
  return records.find(item => (
    String(item.studentId) === String(target.StudentId)
    && toDateOnly(item.recognizeTime) === toDateOnly(targetTime)
    && Number(item.direction) === Number(target.Direction)
  ));
}

function submitMakeupAttendance(data) {
  const period = getMakeupPeriodTime(data.periodKey);
  const payload = {
    StudentId: Number(data.studentId),
    MethodId: 1,
    DeviceId: 2,
    RecognizeTime: toDateTime(data.signDate, period.time),
    Direction: period.direction,
    Location: data.location || '河北',
    Remark: data.reason || '教师补签'
  };

  return apiPost('/api/attendances/records', payload)
    .then(response => {
      if (!isSuccess(response)) {
        throw new Error(getApiMessage(response, '补签失败'));
      }
      return response.data || response;
    })
    .catch(error => getAttendanceByStudentId(data.studentId, data.signDate).then(records => {
      const matched = findMatchingAttendanceRecord(records, payload);
      if (matched) {
        console.warn('补签接口返回错误，但查询到记录已写入', {
          error,
          record: matched
        });
        return matched;
      }
      throw error;
    }));
}

function getLeaveList() {
  return Promise.all([
    fetchDictionaries(['leave-status', 'leave-types']),
    apiGet('/api/leaves/records').then(unwrapData)
  ])
    .then(([dictionaries, data]) => unwrapItems(data).map(item => normalizeLeaveRecord(item, dictionaries)))
    .then(records => {
      wx.setStorageSync(LEAVE_RECORD_STORAGE_KEY, records);
      return records.length ? records : clone(mockData.getLeaveList());
    })
    .catch(error => {
      console.error('请假记录加载失败', error);
      const cachedRecords = getStoredLeaveRecords();
      return cachedRecords.length ? cachedRecords : clone(mockData.getLeaveList());
    });
}

function getLeaveByIndex(index) {
  const cachedRecords = getStoredLeaveRecords();
  if (cachedRecords.length) {
    return clone(cachedRecords[Number(index) || 0] || cachedRecords[0]);
  }

  return clone(mockData.getLeaveByIndex(index));
}

function approveLeaveRecord(id, status, remark = '') {
  const statusId = status === '已通过' ? 1 : 2;

  return apiPost(`/api/leaves/records/${id}/approve`, {
    StatusId: statusId,
    ApproverRemark: remark
  }).then(response => {
    if (!isSuccess(response)) {
      throw new Error(getApiMessage(response, '审批失败'));
    }
    return response.data || response;
  });
}

module.exports = {
  login,
  initializeAppState,
  getCurrentUser,
  getTeacherProfile,
  getTeacherById,
  getCurrentTeacher,
  getLoginAccount,
  getClasses,
  getDefaultClass,
  getClassById,
  getStudents,
  getStudentsByClassId,
  getStudentById,
  getAnnouncements,
  getDefaultDate,
  getAttendanceByStudentId,
  getClassAttendanceSummary,
  getClassDailyAttendance,
  fetchDictionary,
  fetchDictionaries,
  resolveDictionaryName,
  submitMakeupAttendance,
  getLeaveList,
  getLeaveByIndex,
  approveLeaveRecord,
  __test__: {
    resolveDictionaryName,
    normalizeAttendanceRecord,
    normalizeLeaveRecord,
    normalizeTeacher,
    resolveTeacherStatusName,
    buildClassDailyAttendance
  }
};
