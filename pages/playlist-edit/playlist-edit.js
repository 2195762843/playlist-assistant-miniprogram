// 新增/编辑歌单页
const { PlaylistStorage, TagStorage } = require('../../utils/storage');

Page({
  data: {
    isEditing: false,
    playlistId: '',
    formData: {
      name: '',
      description: '',
      tags: []
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
    const { id } = options;

    // 加载预设标签
    const allTags = TagStorage.getAll();
    const presetTags = TagStorage.presetTags;
    const customTags = allTags.filter(tag =>
      !presetTags.some(pt => pt.name === tag.name)
    );

    this.setData({
      presetTags,
      customTags
    });

    // 如果是编辑模式，加载歌单数据
    if (id) {
      const playlist = PlaylistStorage.getById(id);
      if (playlist) {
        this.setData({
          isEditing: true,
          playlistId: id,
          formData: {
            name: playlist.name,
            description: playlist.description || '',
            tags: playlist.tags || []
          }
        });

        wx.setNavigationBarTitle({
          title: '编辑歌单'
        });
      }
    }
  },

  // 歌单名称输入
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },

  // 歌单描述输入
  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    });
  },

  // 切换标签
  toggleTag(e) {
    const tagName = e.currentTarget.dataset.tag;
    const { formData } = this.data;
    const index = formData.tags.indexOf(tagName);

    if (index !== -1) {
      formData.tags.splice(index, 1);
    } else {
      // 最多选择5个标签
      if (formData.tags.length >= 5) {
        wx.showToast({
          title: '最多选择5个标签',
          icon: 'none'
        });
        return;
      }
      formData.tags.push(tagName);
    }

    this.setData({ formData });
  },

  // 显示添加标签弹窗
  showAddTagModal() {
    this.setData({
      showTagModal: true,
      newTagName: '',
      selectedColor: '#4A90E2'
    });
  },

  // 隐藏标签弹窗
  hideTagModal() {
    this.setData({
      showTagModal: false,
      newTagName: '',
      selectedColor: '#4A90E2'
    });
  },

  // 新标签名称输入
  onNewTagNameInput(e) {
    this.setData({
      newTagName: e.detail.value
    });
  },

  // 选择颜色
  selectColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      selectedColor: color
    });
  },

  // 添加自定义标签
  addCustomTag() {
    const { newTagName, selectedColor } = this.data;

    if (!newTagName.trim()) {
      wx.showToast({
        title: '请输入标签名称',
        icon: 'none'
      });
      return;
    }

    // 检查标签是否已存在
    const allTags = TagStorage.getAll();
    if (allTags.some(t => t.name === newTagName.trim())) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
      return;
    }

    // 添加标签
    const result = TagStorage.addCustomTag({
      name: newTagName.trim(),
      color: selectedColor
    });

    if (result.success) {
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });

      // 刷新标签列表
      const allTagsNew = TagStorage.getAll();
      const customTags = allTagsNew.filter(tag =>
        !TagStorage.presetTags.some(pt => pt.name === tag.name)
      );

      this.setData({
        customTags,
        showTagModal: false
      });
    } else {
      wx.showToast({
        title: result.message,
        icon: 'none'
      });
    }
  },

  // 保存歌单
  savePlaylist() {
    const { formData, isEditing, playlistId } = this.data;

    // 验证歌单名称
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入歌单名称',
        icon: 'none'
      });
      return;
    }

    // 准备数据
    const playlistData = {
      ...formData,
      tags: formData.tags.map(tagName => {
        const tag = this.data.presetTags.find(t => t.name === tagName) ||
                    this.data.customTags.find(t => t.name === tagName);
        return tag || { name: tagName, color: '#4A90E2' };
      })
    };

    if (isEditing) {
      playlistData.id = playlistId;
    }

    // 保存
    PlaylistStorage.save(playlistData);

    wx.showToast({
      title: isEditing ? '修改成功' : '创建成功',
      icon: 'success'
    });

    // 返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 阻止事件冒泡
  noop() {
    // 空函数，用于阻止事件冒泡
  }
});
