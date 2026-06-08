// 标签管理页
const { TagStorage } = require('../../utils/storage');

Page({
  data: {
    presetTags: [],
    customTags: [],
    totalTags: 0,
    showModal: false,
    editingTag: null,
    tagForm: {
      name: '',
      color: '#4A90E2'
    },
    tagColors: [
      '#FF6B6B', '#FFA07A', '#FFD700', '#00B894',
      '#4ECDC4', '#45B7D1', '#4A90E2', '#6C5CE7',
      '#A29BFE', '#FD79A8', '#ffffff', '#1D2129'
    ]
  },

  onLoad() {
    this.loadTags();
  },

  onShow() {
    this.loadTags();
  },

  onPullDownRefresh() {
    this.loadTags();
    wx.stopPullDownRefresh();
  },

  // 加载标签数据
  loadTags() {
    const allTags = TagStorage.getAll();
    const presetTags = TagStorage.presetTags;
    const customTags = TagStorage.getCustomTags();

    this.setData({
      presetTags,
      customTags,
      totalTags: allTags.length
    });
  },

  // 显示添加弹窗
  showAddModal() {
    this.setData({
      showModal: true,
      editingTag: null,
      tagForm: {
        name: '',
        color: '#4A90E2'
      }
    });
  },

  // 编辑标签
  editTag(e) {
    const { name, color } = e.currentTarget.dataset;

    this.setData({
      showModal: true,
      editingTag: name,
      tagForm: {
        name,
        color
      }
    });
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({
      showModal: false,
      editingTag: null,
      tagForm: {
        name: '',
        color: '#4A90E2'
      }
    });
  },

  // 标签名称输入
  onTagNameInput(e) {
    this.setData({
      'tagForm.name': e.detail.value
    });
  },

  // 选择颜色
  selectColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      'tagForm.color': color
    });
  },

  // 保存标签
  saveTag() {
    const { tagForm, editingTag } = this.data;

    if (!tagForm.name.trim()) {
      wx.showToast({
        title: '请输入标签名称',
        icon: 'none'
      });
      return;
    }

    // 检查标签名称是否已存在（排除编辑的标签）
    const allTags = TagStorage.getAll();
    const exists = allTags.some(t =>
      t.name === tagForm.name.trim() && t.name !== editingTag
    );

    if (exists) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
      return;
    }

    if (editingTag) {
      // 更新标签
      TagStorage.updateCustomTag(editingTag, {
        name: tagForm.name.trim(),
        color: tagForm.color
      });

      wx.showToast({
        title: '修改成功',
        icon: 'success'
      });
    } else {
      // 添加标签
      const result = TagStorage.addCustomTag({
        name: tagForm.name.trim(),
        color: tagForm.color
      });

      if (result.success) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: result.message,
          icon: 'none'
        });
        return;
      }
    }

    this.hideModal();

    // 重新加载标签
    setTimeout(() => {
      this.loadTags();
    }, 1000);
  },

  // 确认删除标签
  confirmDelete() {
    const { editingTag } = this.data;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除标签"${editingTag}"吗？`,
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          TagStorage.deleteCustomTag(editingTag);
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          this.hideModal();
          setTimeout(() => {
            this.loadTags();
          }, 1000);
        }
      }
    });
  },

  // 删除标签
  deleteTag(e) {
    const name = e.currentTarget.dataset.name;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除标签"${name}"吗？`,
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          TagStorage.deleteCustomTag(name);
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          setTimeout(() => {
            this.loadTags();
          }, 1000);
        }
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 阻止事件冒泡
  noop() {
    // 空函数，用于阻止事件冒泡
  }
});
