// 用户角色
export const USER_ROLES = {
  SYSTEM_ADMIN: 1,
  SCHOOL_ADMIN: 2,
  TEACHER: 3,
  PARENT: 4,
  AGENT: 5,
  STUDENT: 6
};

// API 端点
export const API_ENDPOINTS = {
  // 认证
  LOGIN: '/api/sessions',
  
  // 学生管理
  STUDENTS: '/api/system-admin/students',
  STUDENT_DETAIL: (id) => `/api/system-admin/students/${id}`,
  
  // 教师管理
  TEACHERS: '/api/system-admin/teachers',
  TEACHER_DETAIL: (id) => `/api/system-admin/teachers/${id}`,
  
  // 家长管理
  PARENTS: '/api/system-admin/parents',
  PARENT_DETAIL: (id) => `/api/system-admin/parents/${id}`,
  PARENT_CHILDREN: (id) => `/api/parents/${id}/children`,
  
  // 考勤
  ATTENDANCES: '/api/system-admin/attendances',
  STUDENT_ATTENDANCE: (id) => `/api/attendance/student/${id}`,
  
  // 请假
  LEAVE_RECORDS: '/api/leave/parent-records',
  LEAVE_APPLY: '/api/leave/parent-apply',
  LEAVE_DETAIL: (id) => `/api/leave/${id}`,
  
  // 字典
  DICT: (type) => `/api/commons/dict/${type}`,
  DICT_ITEM: (type, id) => `/api/commons/dict/${type}/${id}`,
  
  // 文件
  UPLOAD_FILE: (category) => `/api/resources/files/${category}`,
  FILE_LIST: '/api/resources/files',
  FILE_DETAIL: (id) => `/api/resources/files/${id}`
};

// 页面路由
export const PAGE_ROUTES = {
  LOGIN: '/pages/login/login',
  HOME: '/pages/home/home',
  STUDENT_LIST: '/pages/student/student',
  ATTENDANCE: '/pages/attendance/attendance',
  LEAVE: '/pages/leave/leave'
};
