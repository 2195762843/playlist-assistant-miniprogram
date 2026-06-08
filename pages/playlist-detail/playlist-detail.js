// 歌单详情页
const { PlaylistStorage, SongStorage, TagStorage } = require('../../utils/storage');

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
      mood: '',
      tags: []
    }
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

    // 加载歌单信息
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

    // 加载歌曲列表
    const songs = SongStorage.getByPlaylistId(playlistId);
    const displayedSongs = this.formatSongsForDisplay(songs);

    // 加载标签
    const allTags = TagStorage.getAll();

    this.setData({
      playlist: {
        ...playlist,
        createTimeFormat: this.formatDate(playlist.createTime)
      },
      songs,
      displayedSongs,
      allTags
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
        mood: '',
        tags: []
      }
    });
  },

  // 编辑歌曲
  editSong(e) {
    const id = e.currentTarget.dataset.id;
    const song = SongStorage.getById(id);

    if (song) {
      this.setData({
        showSongModal: true,
        editingSong: song,
        songForm: {
          name: song.name,
          artist: song.artist || '',
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

  // 保存歌曲
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

    // 保存歌曲
    const songData = {
      ...songForm,
      playlistId
    };

    if (editingSong) {
      songData.id = editingSong.id;
    }

    SongStorage.save(songData);

    wx.showToast({
      title: editingSong ? '修改成功' : '添加成功',
      icon: 'success'
    });

    this.hideSongModal();

    // 重新加载数据
    setTimeout(() => {
      this.loadData();
    }, 1000);
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
          SongStorage.delete(editingSong.id);
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          this.hideSongModal();
          setTimeout(() => {
            this.loadData();
          }, 1000);
        }
      }
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
          SongStorage.delete(id);
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          setTimeout(() => {
            this.loadData();
          }, 1000);
        }
      }
    });
  },

  // 切换收藏状态
  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id;
    SongStorage.toggleFavorite(id);

    // 重新加载数据
    this.loadData();
  },

  // 阻止事件冒泡
  noop() {
    // 空函数，用于阻止事件冒泡
  }
});
