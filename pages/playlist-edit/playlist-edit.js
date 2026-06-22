const { PlaylistStorage, TagStorage } = require('../../utils/storage');

Page({
  data: {
    isEditing: false,
    playlistId: '',
    formData: {
      name: '',
      description: '',
      tags: [],
      coverUrl: ''
    },
    presetTags: [],
    customTags: [],
    showTagModal: false,
    newTagName: '',
    selectedColor: '#4A90E2',
    tagColors: [
      '#FF6B6B', '#FFA07A', '#FFD700', '#00B894',
      '#4ECDC4', '#45B7D1', '#4A90E2', '#6C5CE7',
      '#A29BFE', '#FD79A8', '#ffffff', '#1D2129'
    ]
  },

  onLoad(options) {
    var that = this;
    var id = options.id;
    TagStorage.getAll(function(err, allTags) {
      var presetTags = TagStorage.presetTags;
      var customTags = allTags.filter(function(tag) {
        return !presetTags.some(function(pt) {
          return pt.name === tag.name;
        });
      });
      that.setData({
        presetTags: presetTags,
        customTags: customTags
      });

      if (id) {
        PlaylistStorage.getById(id, function(err, playlist) {
          if (playlist) {
            that.setData({
              isEditing: true,
              playlistId: id,
              formData: {
                name: playlist.name,
                description: playlist.description || '',
                tags: playlist.tags || [],
                coverUrl: playlist.coverUrl || ''
              }
            });
            wx.setNavigationBarTitle({
              title: '编辑歌单'
            });
          }
        });
      }
    });
  },

  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    });
  },

  toggleTag(e) {
    var tagName = e.currentTarget.dataset.tag;
    var formData = this.data.formData;
    var index = formData.tags.indexOf(tagName);
    if (index !== -1) {
      formData.tags.splice(index, 1);
    } else {
      if (formData.tags.length >= 5) {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        });
        return;
      }
      formData.tags.push(tagName);
    }
    this.setData({ formData: formData });
  },

  chooseCover() {
    var that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var tempFilePath = res.tempFilePaths[0];
        that.uploadCover(tempFilePath);
      },
      fail: function() {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  uploadCover(filePath) {
    var that = this;
    wx.showLoading({ title: '上传中...' });
    var cloudPath = 'playlist-covers/' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '.png';
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: function(res) {
        wx.hideLoading();
        that.setData({
          'formData.coverUrl': res.fileID
        });
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
      }
    });
  },

  removeCover() {
    this.setData({
      'formData.coverUrl': ''
    });
  },

  showAddTagModal() {
    this.setData({
      showTagModal: true,
      newTagName: '',
      selectedColor: '#4A90E2'
    });
  },

  hideTagModal() {
    this.setData({
      showTagModal: false,
      newTagName: '',
      selectedColor: '#4A90E2'
    });
  },

  onNewTagNameInput(e) {
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

  addCustomTag() {
    var that = this;
    var newTagName = this.data.newTagName;
    var selectedColor = this.data.selectedColor;
    if (!newTagName.trim()) {
      wx.showToast({
        title: '请输入标签名称',
        icon: 'none'
      });
      return;
    }

    TagStorage.getAll(function(err, allTags) {
      if (allTags.some(function(t) { return t.name === newTagName.trim(); })) {
        wx.showToast({
          title: '标签已存在',
          icon: 'none'
        });
        return;
      }
      TagStorage.addCustomTag({
        name: newTagName.trim(),
        color: selectedColor
      }, function(err, result) {
        if (result.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          });
          TagStorage.getAll(function(err2, allTagsNew) {
            var customTags = allTagsNew.filter(function(tag) {
              return !TagStorage.presetTags.some(function(pt) {
                return pt.name === tag.name;
              });
            });
            that.setData({
              customTags: customTags,
              showTagModal: false
            });
          });
        } else {
          wx.showToast({
            title: result.message,
            icon: 'none'
          });
        }
      });
    });
  },

  savePlaylist() {
    var that = this;
    var formData = this.data.formData;
    var isEditing = this.data.isEditing;
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入歌单名称',
        icon: 'none'
      });
      return;
    }

    var playlistData = {
      ...formData,
      tags: formData.tags.map(function(tagName) {
        var tag = that.data.presetTags.find(function(t) { return t.name === tagName; }) ||
                  that.data.customTags.find(function(t) { return t.name === tagName; });
        return tag || { name: tagName, color: '#4A90E2' };
      })
    };

    if (isEditing) {
      playlistData._id = that.data.playlistId;
    }

    PlaylistStorage.save(playlistData, function(err, result) {
      if (result) {
        wx.showToast({
          title: isEditing ? '修改成功' : '创建成功',
          icon: 'success'
        });
        setTimeout(function() {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  },

  noop() {}
});