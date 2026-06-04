const dataService = require('../../../../utils/dataService.js');

const STORAGE_KEY = 'student_appraise_records';

function formatDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

Page({
  data: {
    menuButtonTop: 48,
    menuButtonHeight: 32,
    students: [],
    filteredStudents: [],
    classOptions: ['全部班级'],
    selectedClassIndex: 0,
    showAppraiseForm: false,
    studentIndex: -1,
    selectedStudent: {},
    evaluateDate: getToday(),
    appraiseTypes: ['日常表现', '课堂表现', '阶段总结', '家校沟通'],
    appraiseTypeIndex: 0,
    baseScore: 100,
    scoreItems: [2, 3, 4, 5],
    scoreDelta: 16,
    historyScoreDelta: 0,
    totalScore: 116,
    dimensionList: [
      { key: 'classroom', name: '课堂参与', score: 4, isCustom: false, customScore: '' },
      { key: 'homework', name: '作业完成', score: 4, isCustom: false, customScore: '' },
      { key: 'discipline', name: '纪律习惯', score: 4, isCustom: false, customScore: '' },
      { key: 'cooperation', name: '合作沟通', score: 4, isCustom: false, customScore: '' }
    ],
    tagList: [
      { text: '积极发言', selected: true },
      { text: '作业认真', selected: true },
      { text: '遵守纪律', selected: true },
      { text: '乐于合作', selected: false },
      { text: '需要提醒', selected: false },
      { text: '进步明显', selected: false }
    ],
    comment: '',
    editingRecordId: '',
    activeRecordId: '',
    showRecordActionDialog: false,
    records: [],
    currentRecordCount: 0
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
    const students = await dataService.getStudents();
    const optionStudentId = options.studentId || options.id;
    const optionStudentIndex = students.findIndex(item => String(item.id) === String(optionStudentId));
    const hasOptionStudent = optionStudentIndex >= 0;
    const selectedStudent = hasOptionStudent ? students[optionStudentIndex] : {};
    const classOptions = this.getClassOptions(students);
    const selectedClassIndex = hasOptionStudent
      ? Math.max(0, classOptions.findIndex(item => item === selectedStudent.className))
      : 0;

    this.setData({
      students,
      filteredStudents: this.filterStudentsByClass(students, classOptions[selectedClassIndex]),
      classOptions,
      selectedClassIndex,
      studentIndex: hasOptionStudent ? optionStudentIndex : -1,
      selectedStudent,
      showAppraiseForm: hasOptionStudent
    }, () => {
      if (hasOptionStudent) {
        this.generateComment();
        this.loadRecords();
      }
    });
  },

  onShow() {
    if (this.data.showAppraiseForm) {
      this.loadRecords();
    }
  },

  getClassOptions(students = []) {
    const classNames = Array.from(new Set(students.map(item => item.className).filter(Boolean)));
    return ['全部班级'].concat(classNames);
  },

  filterStudentsByClass(students = this.data.students, className = this.data.classOptions[this.data.selectedClassIndex]) {
    if (!className || className === '全部班级') {
      return students;
    }
    return students.filter(item => item.className === className);
  },

  onClassChange(e) {
    const selectedClassIndex = Number(e.detail.value);
    const selectedClassName = this.data.classOptions[selectedClassIndex];
    this.setData({
      selectedClassIndex,
      filteredStudents: this.filterStudentsByClass(this.data.students, selectedClassName)
    });
  },

  onStudentCardTap(e) {
    const studentId = e.currentTarget.dataset.id;
    const student = this.data.students.find(item => String(item.id) === String(studentId));
    if (!student) {
      wx.showToast({
        title: '学生信息不存在',
        icon: 'none'
      });
      return;
    }
    this.selectStudent(student);
  },

  selectStudent(student) {
    const studentIndex = this.data.students.findIndex(item => String(item.id) === String(student.id));
    const selectedClassIndex = Math.max(0, this.data.classOptions.findIndex(item => item === student.className));
    this.setData({
      studentIndex,
      selectedClassIndex,
      filteredStudents: this.filterStudentsByClass(this.data.students, this.data.classOptions[selectedClassIndex]),
      selectedStudent: student,
      showAppraiseForm: true,
      editingRecordId: '',
      activeRecordId: '',
      showRecordActionDialog: false
    }, () => {
      this.generateComment();
      this.loadRecords();
    });
  },

  backToStudentSelect() {
    this.setData({
      showAppraiseForm: false,
      editingRecordId: '',
      activeRecordId: '',
      showRecordActionDialog: false
    });
  },

  onStudentChange(e) {
    const studentIndex = Number(e.detail.value);
    const student = this.data.students[studentIndex];
    if (student) {
      this.selectStudent(student);
    }
  },

  onDateChange(e) {
    this.setData({
      evaluateDate: e.detail.value
    });
  },

  onTypeChange(e) {
    this.setData({
      appraiseTypeIndex: Number(e.detail.value)
    }, () => {
      this.generateComment();
    });
  },

  onDimensionScoreTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    const score = Number(e.currentTarget.dataset.score);
    const dimensionList = this.data.dimensionList.map((item, itemIndex) => (
      itemIndex === index ? { ...item, score, isCustom: false, customScore: '' } : item
    ));

    this.setData({
      dimensionList
    }, () => {
      this.refreshScore();
    });
  },

  onDimensionCustomTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    const dimensionList = this.data.dimensionList.map((item, itemIndex) => (
      itemIndex === index ? { ...item, isCustom: true, customScore: item.customScore || String(item.score) } : item
    ));

    this.setData({
      dimensionList
    }, () => {
      this.refreshScore();
    });
  },

  onCustomScoreInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    const value = e.detail.value;
    const score = value === '' ? 0 : Math.max(0, Number(value) || 0);
    const dimensionList = this.data.dimensionList.map((item, itemIndex) => (
      itemIndex === index ? { ...item, score, isCustom: true, customScore: value } : item
    ));

    this.setData({
      dimensionList
    }, () => {
      this.refreshScore();
    });
  },

  onTagTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    const tagList = this.data.tagList.map((item, itemIndex) => (
      itemIndex === index ? { ...item, selected: !item.selected } : item
    ));

    this.setData({
      tagList
    }, () => {
      this.generateComment();
    });
  },

  onCommentInput(e) {
    this.setData({
      comment: e.detail.value
    });
  },

  calculateScore(dimensionList = this.data.dimensionList) {
    const scoreDelta = dimensionList.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
    return {
      scoreDelta,
      totalScore: this.data.baseScore + this.data.historyScoreDelta + scoreDelta
    };
  },

  getRecordScoreDelta(record) {
    if (record.scoreDelta !== undefined) {
      return Number(record.scoreDelta) || 0;
    }

    const overallScore = Number(record.overallScore) || 0;
    const baseScore = Number(record.baseScore) || this.data.baseScore;

    if (overallScore > baseScore) {
      return overallScore - baseScore;
    }

    return overallScore > 0 && overallScore <= 5 ? overallScore : 0;
  },

  calculateHistoryScoreDelta(records) {
    return records.reduce((sum, record) => sum + this.getRecordScoreDelta(record), 0);
  },

  refreshScore(options = {}) {
    this.setData(this.calculateScore(), () => {
      if (options.preserveComment) {
        return;
      }
      this.generateComment();
    });
  },

  generateComment() {
    const student = this.data.selectedStudent;
    if (!student || !student.id) {
      return;
    }

    const selectedTags = this.data.tagList.filter(item => item.selected).map(item => item.text);
    const lowerDimensions = this.data.dimensionList.filter(item => item.score <= 3).map(item => item.name);
    const highDimensions = this.data.dimensionList.filter(item => item.score >= 4).map(item => item.name);
    const type = this.data.appraiseTypes[this.data.appraiseTypeIndex];

    const strengths = selectedTags.length ? selectedTags.join('、') : highDimensions.join('、') || '学习态度稳定';
    const advice = lowerDimensions.length
      ? `后续建议重点关注${lowerDimensions.join('、')}，通过明确目标和及时反馈帮助其继续提升。`
      : '建议继续保持当前学习节奏，鼓励其在班级活动中承担更多责任。';

    const comment = `${student.name}在${type}中总分为${this.data.totalScore}分，整体表现${this.getScoreText(this.data.totalScore)}，${strengths}。${advice}`;

    this.setData({
      comment
    });
  },

  getScoreText(score) {
    if (score >= 112) {
      return '优秀';
    }
    if (score >= 106) {
      return '良好';
    }
    if (score >= 100) {
      return '平稳';
    }
    return '仍需加强';
  },

  loadRecords() {
    const allRecords = this.getStoredRecords();
    const student = this.data.selectedStudent;
    if (!student || !student.id) {
      this.setData({
        records: [],
        currentRecordCount: 0,
        historyScoreDelta: 0
      });
      return;
    }
    const rawRecords = student
      && student.id
      ? allRecords.filter(item => String(item.studentId) === String(student.id))
      : allRecords;
    const historyRecords = this.data.editingRecordId
      ? rawRecords.filter(item => item.id !== this.data.editingRecordId)
      : rawRecords;
    const historyScoreDelta = this.calculateHistoryScoreDelta(historyRecords);
    const records = rawRecords.map(item => ({
      ...item,
      displayScoreDelta: this.getRecordScoreDelta(item),
      isEditing: item.id === this.data.editingRecordId
    }));

    this.setData({
      records: records.slice(0, 20),
      currentRecordCount: records.length,
      historyScoreDelta
    }, () => {
      this.refreshScore({
        preserveComment: Boolean(this.data.editingRecordId)
      });
    });
  },

  onHistoryLongPress(e) {
    const recordId = e.currentTarget.dataset.id;
    if (!recordId) {
      return;
    }

    this.setData({
      activeRecordId: recordId,
      showRecordActionDialog: true
    });
  },

  closeRecordActionDialog() {
    this.setData({
      activeRecordId: '',
      showRecordActionDialog: false
    });
  },

  handleEditRecord() {
    const recordId = this.data.activeRecordId;
    this.closeRecordActionDialog();
    this.editRecord(recordId);
  },

  handleDeleteRecord() {
    const recordId = this.data.activeRecordId;
    this.closeRecordActionDialog();
    this.confirmDeleteRecord(recordId);
  },

  noop() {},

  editRecord(recordId) {
    const record = this.getStoredRecords().find(item => item.id === recordId);
    if (!record) {
      wx.showToast({
        title: '评价记录不存在',
        icon: 'none'
      });
      return;
    }

    const typeIndex = Math.max(0, this.data.appraiseTypes.findIndex(item => item === record.type));
    const dimensionList = this.normalizeRecordDimensions(record.dimensions);
    const recordTags = Array.isArray(record.tags) ? record.tags : [];
    const tagList = this.data.tagList.map(item => ({
      ...item,
      selected: recordTags.includes(item.text)
    }));

    this.setData({
      editingRecordId: recordId,
      evaluateDate: record.evaluateDate || this.data.evaluateDate,
      appraiseTypeIndex: typeIndex,
      baseScore: Number(record.baseScore) || 100,
      dimensionList,
      tagList,
      comment: record.comment || ''
    }, () => {
      this.loadRecords();
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 200
      });
    });
  },

  normalizeRecordDimensions(dimensions = []) {
    const fallback = this.data.dimensionList;
    return fallback.map(item => {
      const matched = dimensions.find(dimension => dimension.key === item.key) || item;
      const score = Number(matched.score) || 0;
      const isPresetScore = this.data.scoreItems.includes(score);

      return {
        key: item.key,
        name: item.name,
        score,
        isCustom: !isPresetScore || Boolean(matched.isCustom),
        customScore: !isPresetScore || matched.isCustom ? String(score) : ''
      };
    });
  },

  confirmDeleteRecord(recordId) {
    wx.showModal({
      title: '删除评价',
      content: '确定删除这条历史评价吗？删除后当前总分会同步更新。',
      confirmText: '删除',
      confirmColor: '#e53935',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord(recordId);
        }
      }
    });
  },

  deleteRecord(recordId) {
    const records = this.getStoredRecords().filter(item => item.id !== recordId);
    wx.setStorageSync(STORAGE_KEY, records);

    const nextData = {};
    if (this.data.editingRecordId === recordId) {
      nextData.editingRecordId = '';
    }

    this.setData(nextData, () => {
      this.loadRecords();
      wx.showToast({
        title: '已删除',
        icon: 'success'
      });
    });
  },

  getStoredRecords() {
    try {
      const records = wx.getStorageSync(STORAGE_KEY);
      return Array.isArray(records) ? records : [];
    } catch (error) {
      return [];
    }
  },

  saveAppraise() {
    const student = this.data.selectedStudent;
    const comment = this.data.comment.trim();

    if (!student || !student.id) {
      wx.showToast({
        title: '请先选择学生',
        icon: 'none'
      });
      return;
    }

    if (!comment) {
      wx.showToast({
        title: '请填写评价内容',
        icon: 'none'
      });
      return;
    }

    const editingRecordId = this.data.editingRecordId;
    const storedRecords = this.getStoredRecords();
    const previousRecord = editingRecordId
      ? storedRecords.find(item => item.id === editingRecordId)
      : null;
    const record = {
      ...(previousRecord || {}),
      id: editingRecordId || `${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      className: student.className,
      evaluateDate: this.data.evaluateDate,
      type: this.data.appraiseTypes[this.data.appraiseTypeIndex],
      baseScore: this.data.baseScore,
      scoreDelta: this.data.scoreDelta,
      overallScore: this.data.totalScore,
      dimensions: this.data.dimensionList.map(item => ({ ...item })),
      tags: this.data.tagList.filter(item => item.selected).map(item => item.text),
      comment,
      createdAt: previousRecord && previousRecord.createdAt ? previousRecord.createdAt : formatDateTime(),
      updatedAt: editingRecordId ? formatDateTime() : ''
    };

    const records = editingRecordId
      ? storedRecords.map(item => (item.id === editingRecordId ? record : item))
      : [record].concat(storedRecords);
    wx.setStorageSync(STORAGE_KEY, records);

    wx.showToast({
      title: editingRecordId ? '评价已更新' : '评价已保存',
      icon: 'success'
    });

    this.setData({
      editingRecordId: '',
      dimensionList: [
        { key: 'classroom', name: '课堂参与', score: 0, isCustom: true, customScore: '0' },
        { key: 'homework', name: '作业完成', score: 0, isCustom: true, customScore: '0' },
        { key: 'discipline', name: '纪律习惯', score: 0, isCustom: true, customScore: '0' },
        { key: 'cooperation', name: '合作沟通', score: 0, isCustom: true, customScore: '0' }
      ]
    }, () => {
      this.loadRecords();
    });
  },

  resetForm() {
    this.setData({
      editingRecordId: '',
      appraiseTypeIndex: 0,
      baseScore: 100,
      dimensionList: [
        { key: 'classroom', name: '课堂参与', score: 4, isCustom: false, customScore: '' },
        { key: 'homework', name: '作业完成', score: 4, isCustom: false, customScore: '' },
        { key: 'discipline', name: '纪律习惯', score: 4, isCustom: false, customScore: '' },
        { key: 'cooperation', name: '合作沟通', score: 4, isCustom: false, customScore: '' }
      ],
      tagList: [
        { text: '积极发言', selected: true },
        { text: '作业认真', selected: true },
        { text: '遵守纪律', selected: true },
        { text: '乐于合作', selected: false },
        { text: '需要提醒', selected: false },
        { text: '进步明显', selected: false }
      ]
    }, () => {
      this.loadRecords();
    });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    wx.switchTab({
      url: '/pages/teacher/main/home/home'
    });
  }
});
