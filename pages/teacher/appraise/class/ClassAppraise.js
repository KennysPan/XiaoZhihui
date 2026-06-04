const dataService = require('../../../../utils/dataService.js');

const STORAGE_KEY = 'class_appraise_records';

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
    classes: [],
    classNames: [],
    showAppraiseForm: false,
    classIndex: -1,
    selectedClass: {},
    studentCount: 0,
    evaluateDate: getToday(),
    periodTypes: ['本周评比', '本月评比', '阶段评比', '期末评比'],
    periodIndex: 0,
    scoreOptions: [16, 18, 20, 22, 25],
    dimensionList: [
      { key: 'attendance', name: '出勤纪律', score: 20, isCustom: false, customScore: '' },
      { key: 'learning', name: '课堂学习', score: 20, isCustom: false, customScore: '' },
      { key: 'hygiene', name: '卫生值日', score: 20, isCustom: false, customScore: '' },
      { key: 'activity', name: '活动协作', score: 20, isCustom: false, customScore: '' },
      { key: 'culture', name: '班风建设', score: 20, isCustom: false, customScore: '' }
    ],
    totalScore: 100,
    levelText: '优秀',
    tagList: [
      { text: '纪律稳定', selected: true },
      { text: '课堂活跃', selected: true },
      { text: '卫生整洁', selected: true },
      { text: '协作意识强', selected: false },
      { text: '进步明显', selected: false },
      { text: '需持续跟进', selected: false }
    ],
    comment: '',
    rankingList: [],
    firstRankName: '--',
    records: [],
    currentRecordCount: 0,
    editingRecordId: '',
    activeRecordId: '',
    showRecordActionDialog: false
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
    const classes = await dataService.getClasses();
    const optionClassId = options.classId || options.id;
    const optionClassIndex = classes.findIndex(item => String(item.classId) === String(optionClassId));
    const hasOptionClass = optionClassIndex >= 0;

    this.setData({
      classes,
      classNames: classes.map(item => item.name),
      classIndex: hasOptionClass ? optionClassIndex : -1,
      selectedClass: hasOptionClass ? classes[optionClassIndex] : {},
      showAppraiseForm: hasOptionClass
    }, () => {
      if (hasOptionClass) {
        this.refreshClassInfo();
        this.refreshScore();
        this.loadRecords();
      }
    });
  },

  onShow() {
    if (this.data.showAppraiseForm) {
      this.loadRecords();
    }
  },

  onClassChange(e) {
    const classIndex = Number(e.detail.value);
    const selectedClass = this.data.classes[classIndex];
    if (selectedClass) {
      this.selectClass(selectedClass);
    }
  },

  onClassCardTap(e) {
    const classId = e.currentTarget.dataset.id;
    const selectedClass = this.data.classes.find(item => String(item.classId) === String(classId));
    if (!selectedClass) {
      wx.showToast({
        title: '班级信息不存在',
        icon: 'none'
      });
      return;
    }
    this.selectClass(selectedClass);
  },

  selectClass(selectedClass) {
    const classIndex = this.data.classes.findIndex(item => String(item.classId) === String(selectedClass.classId));
    this.setData({
      classIndex,
      selectedClass,
      showAppraiseForm: true,
      editingRecordId: '',
      activeRecordId: '',
      showRecordActionDialog: false
    }, () => {
      this.refreshClassInfo();
      this.resetForm({ keepClass: true });
      this.loadRecords();
    });
  },

  backToClassSelect() {
    this.setData({
      showAppraiseForm: false,
      editingRecordId: '',
      activeRecordId: '',
      showRecordActionDialog: false
    });
  },

  onDateChange(e) {
    this.setData({
      evaluateDate: e.detail.value
    });
  },

  onPeriodChange(e) {
    this.setData({
      periodIndex: Number(e.detail.value)
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
    const score = value === '' ? 0 : Math.max(0, Math.min(30, Number(value) || 0));
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

  async refreshClassInfo() {
    const selectedClass = this.data.selectedClass || {};
    if (!selectedClass.classId) {
      this.setData({
        studentCount: 0
      });
      return;
    }
    const students = await dataService.getStudentsByClassId(selectedClass.classId);

    this.setData({
      studentCount: students.length
    });
  },

  refreshScore(options = {}) {
    const totalScore = this.data.dimensionList.reduce((sum, item) => sum + (Number(item.score) || 0), 0);

    this.setData({
      totalScore,
      levelText: this.getLevelText(totalScore)
    }, () => {
      this.refreshRanking();
      if (!options.preserveComment) {
        this.generateComment();
      }
    });
  },

  getLevelText(score) {
    if (score >= 105) {
      return '卓越';
    }
    if (score >= 95) {
      return '优秀';
    }
    if (score >= 85) {
      return '良好';
    }
    if (score >= 75) {
      return '达标';
    }
    return '待提升';
  },

  getStoredRecords() {
    try {
      const records = wx.getStorageSync(STORAGE_KEY);
      return Array.isArray(records) ? records : [];
    } catch (error) {
      return [];
    }
  },

  getLatestRecordByClassId(records, classId) {
    return records.find(item => String(item.classId) === String(classId));
  },

  getDefaultClassScore(classItem) {
    const attendanceScore = 26;
    const disciplineScore = 20;
    const learningScore = 22 + (classItem.studentCount % 3);
    const hygieneScore = 20 + (classItem.id % 4);
    const cultureScore = 21 + (classItem.id % 3);

    return Math.min(110, attendanceScore + disciplineScore + learningScore + hygieneScore + cultureScore);
  },

  refreshRanking(records = this.getStoredRecords()) {
    const rankingList = this.data.classes
      .map(classItem => {
        const latestRecord = this.getLatestRecordByClassId(records, classItem.classId);
        const isCurrentClass = String(classItem.classId) === String(this.data.selectedClass.classId);
        const score = isCurrentClass
          ? this.data.totalScore
          : latestRecord
            ? latestRecord.totalScore
            : this.getDefaultClassScore(classItem);

        return {
          classId: classItem.classId,
          name: classItem.name,
          score,
          levelText: this.getLevelText(score),
          studentCount: classItem.studentCount,
          sourceText: isCurrentClass ? '当前' : latestRecord ? '已评' : '参考'
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        isCurrent: String(item.classId) === String(this.data.selectedClass.classId)
      }));

    this.setData({
      rankingList,
      firstRankName: rankingList.length ? rankingList[0].name : '--'
    });
  },

  generateComment() {
    const selectedClass = this.data.selectedClass;
    if (!selectedClass || !selectedClass.classId) {
      return;
    }

    const selectedTags = this.data.tagList.filter(item => item.selected).map(item => item.text);
    const lowerDimensions = this.data.dimensionList.filter(item => item.score < 18).map(item => item.name);
    const highDimensions = this.data.dimensionList.filter(item => item.score >= 22).map(item => item.name);
    const period = this.data.periodTypes[this.data.periodIndex];
    const strengths = selectedTags.length ? selectedTags.join('、') : highDimensions.join('、') || '整体秩序稳定';
    const advice = lowerDimensions.length
      ? `后续建议重点提升${lowerDimensions.join('、')}，通过明确班级目标和分工责任持续改进。`
      : '建议继续保持当前班级氛围，鼓励学生在学习、活动与自治中承担更多责任。';

    this.setData({
      comment: `${selectedClass.name}${period}总分为${this.data.totalScore}分，等级为${this.data.levelText}，${strengths}。${advice}`
    });
  },

  loadRecords() {
    const allRecords = this.getStoredRecords();
    const selectedClass = this.data.selectedClass;
    const records = selectedClass && selectedClass.classId
      ? allRecords.filter(item => String(item.classId) === String(selectedClass.classId))
      : allRecords;

    this.setData({
      records: records.map(item => ({
        ...item,
        isEditing: item.id === this.data.editingRecordId
      })).slice(0, 20),
      currentRecordCount: records.length
    }, () => {
      this.refreshRanking(allRecords);
    });
  },

  saveAppraise() {
    const selectedClass = this.data.selectedClass;
    const comment = this.data.comment.trim();

    if (!selectedClass || !selectedClass.classId) {
      wx.showToast({
        title: '请先选择班级',
        icon: 'none'
      });
      return;
    }

    if (!comment) {
      wx.showToast({
        title: '请填写评比说明',
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
      id: editingRecordId || `${selectedClass.classId}-${Date.now()}`,
      classId: selectedClass.classId,
      className: selectedClass.name,
      evaluateDate: this.data.evaluateDate,
      period: this.data.periodTypes[this.data.periodIndex],
      totalScore: this.data.totalScore,
      levelText: this.data.levelText,
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
      title: editingRecordId ? '评比已更新' : '评比已保存',
      icon: 'success'
    });

    this.setData({
      editingRecordId: ''
    }, () => {
      this.loadRecords();
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
        title: '评比记录不存在',
        icon: 'none'
      });
      return;
    }

    const periodIndex = Math.max(0, this.data.periodTypes.findIndex(item => item === record.period));
    const dimensionList = this.normalizeRecordDimensions(record.dimensions);
    const recordTags = Array.isArray(record.tags) ? record.tags : [];
    const tagList = this.data.tagList.map(item => ({
      ...item,
      selected: recordTags.includes(item.text)
    }));

    this.setData({
      editingRecordId: recordId,
      evaluateDate: record.evaluateDate || this.data.evaluateDate,
      periodIndex,
      dimensionList,
      tagList,
      comment: record.comment || ''
    }, () => {
      this.refreshScore({ preserveComment: true });
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
      const isPresetScore = this.data.scoreOptions.includes(score);

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
      title: '删除评比',
      content: '确定删除这条班级评比记录吗？删除后排行榜会同步更新。',
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

  resetForm(options = {}) {
    this.setData({
      editingRecordId: '',
      periodIndex: 0,
      dimensionList: [
        { key: 'attendance', name: '出勤纪律', score: 20, isCustom: false, customScore: '' },
        { key: 'learning', name: '课堂学习', score: 20, isCustom: false, customScore: '' },
        { key: 'hygiene', name: '卫生值日', score: 20, isCustom: false, customScore: '' },
        { key: 'activity', name: '活动协作', score: 20, isCustom: false, customScore: '' },
        { key: 'culture', name: '班风建设', score: 20, isCustom: false, customScore: '' }
      ],
      tagList: [
        { text: '纪律稳定', selected: true },
        { text: '课堂活跃', selected: true },
        { text: '卫生整洁', selected: true },
        { text: '协作意识强', selected: false },
        { text: '进步明显', selected: false },
        { text: '需持续跟进', selected: false }
      ]
    }, () => {
      this.refreshScore();
      if (!options.keepClass) {
        this.loadRecords();
      }
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
