const { TagStorage } = require('../../utils/storage');

Page({
  data: {
    tags: [],
    customTags: [],
    totalTags: 0,
    showModal: false,
    editingTag: null,
    newTagName: '',
    selectedColor: '#4A90E2',
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

  loadTags() {
    var that = this;
    TagStorage.getAll(function(err, tags) {
      TagStorage.getCustomTags(function(err2, customTags) {
        that.setData({
          tags: tags,
          customTags: customTags,
          totalTags: tags.length
        });
      });
    });
  },

  showAddModal() {
    this.setData({
      showModal: true,
      editingTag: null,
      newTagName: '',
      selectedColor: '#4A90E2'
    });
  },

  showEditModal(e) {
    var tag = e.currentTarget.dataset.tag;
    this.setData({
      showModal: true,
      editingTag: tag,
      newTagName: tag.name,
      selectedColor: tag.color
    });
  },

  hideModal() {
    this.setData({
      showModal: false,
      editingTag: null,
      newTagName: '',
      selectedColor: '#4A90E2'
    });
  },

  onTagNameInput(e) {
    this.setData({
      newTagName: e.detail.value
    });
  },

  selectColor(e) {
    var color = e.currentTarget.dataset.color;
    this.setData({
      selectedColor: color
    });
  },

  saveTag() {
    var that = this;
    var newTagName = this.data.newTagName;
    var selectedColor = this.data.selectedColor;
    var editingTag = this.data.editingTag;

    if (!newTagName.trim()) {
      wx.showToast({
        title: '请输入标签名称',
        icon: 'none'
      });
      return;
    }

    if (editingTag) {
      TagStorage.updateCustomTag(editingTag.name, {
        name: newTagName.trim(),
        color: selectedColor
      }, function(err, success) {
        if (success) {
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          });
          that.hideModal();
          that.loadTags();
        } else {
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          });
        }
      });
    } else {
      TagStorage.addCustomTag({
        name: newTagName.trim(),
        color: selectedColor
      }, function(err, result) {
        if (result.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          that.hideModal();
          that.loadTags();
        } else {
          wx.showToast({
            title: result.message,
            icon: 'none'
          });
        }
      });
    }
  },

  deleteTag(e) {
    var that = this;
    var tag = e.currentTarget.dataset.tag;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除标签"' + tag.name + '"吗？',
      confirmColor: '#FF6B6B',
      success: function(res) {
        if (res.confirm) {
          TagStorage.deleteCustomTag(tag.name, function(err, success) {
            if (success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              that.loadTags();
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },

  noop() {}
});