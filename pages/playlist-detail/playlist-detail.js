// 歌单详情页
const { PlaylistStorage, TagStorage } = require('../../utils/storage');

Page({
  data: {
    playlistId: '',
    playlist: {},
    songs: [],
    displayedSongs: [],
    allTags: [],
    selectedTags: [],
    showSongModal: false,
    editingSong: null,
    songForm: {
      name: '',
      artist: '',
      album: '',
      mood: '',
      tags: []
    },
    isLoading: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ playlistId: id });
      this.loadData();
    }
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.playlistId) {
      this.loadData();
    }
  },

  onPullDownRefresh() {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  // 加载数据
  loadData() {
    const { playlistId } = this.data;

    // 加载歌单信息（本地存储）
    const playlist = PlaylistStorage.getById(playlistId);
    if (!playlist) {
      wx.showToast({
        title: '歌单不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 加载标签（本地存储）
    const allTags = TagStorage.getAll();

    this.setData({
      playlist: {
        ...playlist,
        createTimeFormat: this.formatDate(playlist.createTime)
      },
      allTags
    });

    // 从云数据库加载歌曲列表
    this.loadSongsFromCloud(playlistId);
  },

  // 从云数据库加载歌曲列表
  loadSongsFromCloud(playlistId) {
    this.setData({ isLoading: true });

    wx.cloud.callFunction({
      name: 'getSongs',
      data: { playlistId: playlistId }
    }).then(res => {
      this.setData({ isLoading: false });
      if (res.result.success) {
        const songs = res.result.data;
        const displayedSongs = this.formatSongsForDisplay(songs);
        this.setData({
          songs,
          displayedSongs
        });
      } else {
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      this.setData({ isLoading: false });
      console.error('加载歌曲失败', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // 格式化歌曲数据用于显示
  formatSongsForDisplay(songs) {
    return songs.map(song => ({
      ...song
    }));
  },

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month}/${day}`;
  },

  // 获取标签颜色
  getTagColor(tagName) {
    const tag = this.data.allTags.find(t => t.name === tagName);
    return tag ? tag.color : '#E8F4FD';
  },

  // 切换标签筛选
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const { selectedTags } = this.data;
    const index = selectedTags.indexOf(tag);

    if (index !== -1) {
      selectedTags.splice(index, 1);
    } else {
      selectedTags.push(tag);
    }

    this.setData({ selectedTags });
    this.applyFilters();
  },

  // 应用筛选
  applyFilters() {
    let filtered = this.data.songs;

    // 按标签筛选
    if (this.data.selectedTags.length > 0) {
      filtered = filtered.filter(song =>
        song.tags && song.tags.some(tag => this.data.selectedTags.includes(tag))
      );
    }

    this.setData({
      displayedSongs: this.formatSongsForDisplay(filtered)
    });
  },

  // 跳转到标签管理
  goToTags() {
    wx.navigateTo({
      url: '/pages/tags/tags'
    });
  },

  // 跳转到编辑歌单
  goToEditPlaylist() {
    wx.navigateTo({
      url: `/pages/playlist-edit/playlist-edit?id=${this.data.playlistId}`
    });
  },

  // 显示添加歌曲弹窗
  showAddSongModal() {
    this.setData({
      showSongModal: true,
      editingSong: null,
      songForm: {
        name: '',
        artist: '',
        album: '',
        mood: '',
        tags: []
      }
    });
  },

  // 编辑歌曲
  editSong(e) {
    const id = e.currentTarget.dataset.id;
    // 从当前显示的歌曲列表中找到歌曲
    const song = this.data.songs.find(s => s._id === id || s.id === id);

    if (song) {
      this.setData({
        showSongModal: true,
        editingSong: song,
        songForm: {
          name: song.name,
          artist: song.artist || '',
          album: song.album || '',
          mood: song.mood || '',
          tags: song.tags || []
        }
      });
    }
  },

  // 隐藏弹窗
  hideSongModal() {
    this.setData({
      showSongModal: false,
      editingSong: null,
      songForm: {
        name: '',
        artist: '',
        album: '',
        mood: '',
        tags: []
      }
    });
  },

  // 歌曲名称输入
  onSongNameInput(e) {
    this.setData({
      'songForm.name': e.detail.value
    });
  },

  // 歌手输入
  onSongArtistInput(e) {
    this.setData({
      'songForm.artist': e.detail.value
    });
  },

  // 专辑输入
  onSongAlbumInput(e) {
    this.setData({
      'songForm.album': e.detail.value
    });
  },

  // 心情备注输入
  onSongMoodInput(e) {
    this.setData({
      'songForm.mood': e.detail.value
    });
  },

  // 切换歌曲标签
  toggleSongTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const { songForm } = this.data;
    const index = songForm.tags.indexOf(tag);

    if (index !== -1) {
      songForm.tags.splice(index, 1);
    } else {
      songForm.tags.push(tag);
    }

    this.setData({ songForm });
  },

  // 保存歌曲（新增到云数据库）
  saveSong() {
    const { songForm, editingSong, playlistId } = this.data;

    // 验证歌曲名称
    if (!songForm.name.trim()) {
      wx.showToast({
        title: '请输入歌曲名称',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    // 准备歌曲数据
    const songData = {
      name: songForm.name.trim(),
      artist: songForm.artist.trim(),
      album: songForm.album.trim(),
      mood: songForm.mood.trim(),
      tags: songForm.tags,
      playlistId: playlistId
    };

    // 如果是编辑模式，调用更新；如果是新增模式，调用云函数添加
    if (editingSong) {
      // 编辑模式：先删除旧记录，再添加新记录（简化处理）
      this.updateSongInCloud(editingSong, songData);
    } else {
      // 新增模式：调用 addSong 云函数
      this.addSongToCloud(songData);
    }
  },

  // 添加歌曲到云数据库
  addSongToCloud(songData) {
    wx.cloud.callFunction({
      name: 'addSong',
      data: { songData: songData }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
        this.hideSongModal();
        // 重新加载歌曲列表
        setTimeout(() => {
          this.loadSongsFromCloud(this.data.playlistId);
        }, 1000);
      } else {
        wx.showToast({
          title: res.result.message || '添加失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('添加歌曲失败', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // 更新云数据库中的歌曲
  updateSongInCloud(oldSong, newSongData) {
    const songId = oldSong._id || oldSong.id;
    if (!songId) {
      wx.hideLoading();
      wx.showToast({ title: '歌曲ID不存在', icon: 'none' });
      return;
    }

    // 先删除旧记录
    wx.cloud.callFunction({
      name: 'deleteSong',
      data: { songId: songId }
    }).then(res => {
      if (res.result.success) {
        // 删除成功后添加新记录
        this.addSongToCloud(newSongData);
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '修改失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('修改歌曲失败', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // 删除歌曲确认
  confirmDeleteSong() {
    const { editingSong } = this.data;
    if (!editingSong) return;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除歌曲"${editingSong.name}"吗？`,
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          this.deleteSongFromCloud(editingSong);
        }
      }
    });
  },

  // 从云数据库删除歌曲
  deleteSongFromCloud(song) {
    const songId = song._id || song.id;
    if (!songId) {
      wx.showToast({ title: '歌曲ID不存在', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '删除中...' });

    wx.cloud.callFunction({
      name: 'deleteSong',
      data: { songId: songId }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        this.hideSongModal();
        // 重新加载歌曲列表
        setTimeout(() => {
          this.loadSongsFromCloud(this.data.playlistId);
        }, 1000);
      } else {
        wx.showToast({
          title: res.result.message || '删除失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('删除歌曲失败', err);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    });
  },

  // 删除歌曲（从列表）
  deleteSong(e) {
    const { id, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除歌曲"${name}"吗？`,
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          // 找到对应的歌曲对象
          const song = this.data.songs.find(s => (s._id === id || s.id === id));
          if (song) {
            this.deleteSongFromCloud(song);
          }
        }
      }
    });
  },

  // 切换收藏状态（更新到云数据库）
  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id;
    const song = this.data.songs.find(s => (s._id === id || s.id === id));

    if (song) {
      song.isFavorite = !song.isFavorite;

      // 调用云函数更新收藏状态
      wx.cloud.callFunction({
        name: 'addSong',
        data: { songData: song }
      }).then(res => {
        if (res.result.success) {
          // 重新加载歌曲列表
          this.loadSongsFromCloud(this.data.playlistId);
        }
      }).catch(err => {
        console.error('更新收藏状态失败', err);
      });
    }
  },

  // 阻止事件冒泡
  noop() {
    // 空函数，用于阻止事件冒泡
  }
});