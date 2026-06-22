const { TagStorage } = require('../../utils/storage');

Page({
  data: {
    playlist: null,
    songs: [],
    playlistId: '',
    showAddModal: false,
    showEditModal: false,
    editingSong: null,
    songForm: {
      name: '',
      artist: '',
      album: '',
      mood: '',
      tags: []
    },
    allTags: [],
    presetTags: [],
    customTags: []
  },

  onLoad(options) {
    var that = this;
    var id = options.id;
    that.setData({ playlistId: id });
    
    TagStorage.getAll(function(err, allTags) {
      var presetTags = TagStorage.presetTags;
      var customTags = allTags.filter(function(tag) {
        return !presetTags.some(function(pt) { return pt.name === tag.name; });
      });
      that.setData({
        allTags: allTags,
        presetTags: presetTags,
        customTags: customTags
      });
    });

    that.loadPlaylist();
    that.loadSongs();
  },

  onShow() {
    this.loadPlaylist();
    this.loadSongs();
  },

  onPullDownRefresh() {
    this.loadPlaylist();
    this.loadSongs();
    wx.stopPullDownRefresh();
  },

  loadPlaylist() {
    var that = this;
    wx.cloud.callFunction({
      name: 'getPlaylists',
      success: function(res) {
        if (res.result.success) {
          var playlist = res.result.data.find(function(p) {
            return p._id === that.data.playlistId || p.id === that.data.playlistId;
          });
          if (playlist) {
            that.setData({ playlist: playlist });
            wx.setNavigationBarTitle({ title: playlist.name });
          }
        }
      },
      fail: function() {
        var playlists = wx.getStorageSync('playlists') || [];
        var playlist = playlists.find(function(p) {
          return p._id === that.data.playlistId || p.id === that.data.playlistId;
        });
        if (playlist) {
          that.setData({ playlist: playlist });
          wx.setNavigationBarTitle({ title: playlist.name });
        }
      }
    });
  },

  loadSongs() {
    var that = this;
    wx.cloud.callFunction({
      name: 'getSongs',
      data: { playlistId: that.data.playlistId },
      success: function(res) {
        if (res.result.success) {
          that.setData({ songs: res.result.data });
        }
      },
      fail: function() {
        var songs = wx.getStorageSync('songs') || [];
        var filteredSongs = songs.filter(function(s) {
          return s.playlistId === that.data.playlistId;
        });
        that.setData({ songs: filteredSongs });
      }
    });
  },

  showAddSongModal() {
    this.setData({
      showAddModal: true,
      showEditModal: false,
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

  showEditSongModal(e) {
    var song = e.currentTarget.dataset.song;
    this.setData({
      showEditModal: true,
      showAddModal: false,
      editingSong: song,
      songForm: {
        name: song.name,
        artist: song.artist || '',
        album: song.album || '',
        mood: song.mood || '',
        tags: song.tags || []
      }
    });
  },

  hideSongModal() {
    this.setData({
      showAddModal: false,
      showEditModal: false,
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

  onSongFieldInput(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    var songForm = this.data.songForm;
    songForm[field] = value;
    this.setData({ songForm: songForm });
  },

  toggleSongTag(e) {
    var tagName = e.currentTarget.dataset.tag;
    var songForm = this.data.songForm;
    var index = songForm.tags.indexOf(tagName);
    if (index !== -1) {
      songForm.tags.splice(index, 1);
    } else {
      if (songForm.tags.length >= 5) {
        wx.showToast({ title: '最多选择5个标签', icon: 'none' });
        return;
      }
      songForm.tags.push(tagName);
    }
    this.setData({ songForm: songForm });
  },

  saveSong() {
    var that = this;
    var songForm = this.data.songForm;
    var editingSong = this.data.editingSong;
    var playlistId = this.data.playlistId;

    if (!songForm.name.trim()) {
      wx.showToast({ title: '请输入歌曲名称', icon: 'none' });
      return;
    }

    var songData = {
      ...songForm,
      playlistId: playlistId,
      tags: songForm.tags.map(function(tagName) {
        var tag = that.data.presetTags.find(function(t) { return t.name === tagName; }) ||
                  that.data.customTags.find(function(t) { return t.name === tagName; });
        return tag || { name: tagName, color: '#4A90E2' };
      }),
      isFavorite: editingSong ? editingSong.isFavorite : false
    };

    var apiName = editingSong ? 'updateSong' : 'addSong';
    if (editingSong) {
      songData.songId = editingSong._id || editingSong.id;
    }

    wx.cloud.callFunction({
      name: apiName,
      data: songData,
      success: function(res) {
        if (res.result.success) {
          wx.showToast({
            title: editingSong ? '修改成功' : '添加成功',
            icon: 'success'
          });
          that.hideSongModal();
          that.loadSongs();
        }
      },
      fail: function() {
        var songs = wx.getStorageSync('songs') || [];
        if (editingSong) {
          var index = songs.findIndex(function(s) {
            return s._id === editingSong._id || s.id === editingSong.id;
          });
          if (index !== -1) {
            songs[index] = { ...songData, _id: editingSong._id, id: editingSong.id, updateTime: Date.now() };
          }
        } else {
          var newSong = {
            ...songData,
            _id: Date.now().toString(),
            id: Date.now().toString(),
            createTime: Date.now(),
            updateTime: Date.now()
          };
          songs.unshift(newSong);
        }
        wx.setStorageSync('songs', songs);
        wx.showToast({
          title: editingSong ? '修改成功' : '添加成功',
          icon: 'success'
        });
        that.hideSongModal();
        that.loadSongs();
      }
    });
  },

  deleteSong(e) {
    var that = this;
    var song = e.currentTarget.dataset.song;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除歌曲"' + song.name + '"吗？',
      confirmColor: '#FF6B6B',
      success: function(res) {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'deleteSong',
            data: { songId: song._id || song.id },
            success: function(res) {
              if (res.result.success) {
                that.loadSongs();
              }
            },
            fail: function() {
              var songs = wx.getStorageSync('songs') || [];
              songs = songs.filter(function(s) {
                return s._id !== song._id && s.id !== song.id;
              });
              wx.setStorageSync('songs', songs);
              that.loadSongs();
            }
          });
          wx.showToast({ title: '删除成功', icon: 'success' });
        }
      }
    });
  },

  toggleFavorite(e) {
    var that = this;
    var song = e.currentTarget.dataset.song;
    var songData = {
      songId: song._id || song.id,
      isFavorite: !song.isFavorite
    };
    wx.cloud.callFunction({
      name: 'updateSong',
      data: songData,
      success: function(res) {
        if (res.result.success) {
          that.loadSongs();
        }
      },
      fail: function() {
        var songs = wx.getStorageSync('songs') || [];
        var index = songs.findIndex(function(s) {
          return s._id === song._id || s.id === song.id;
        });
        if (index !== -1) {
          songs[index].isFavorite = !songs[index].isFavorite;
          songs[index].updateTime = Date.now();
          wx.setStorageSync('songs', songs);
          that.loadSongs();
        }
      }
    });
  },

  editPlaylist() {
    wx.navigateTo({
      url: '/pages/playlist-edit/playlist-edit?id=' + this.data.playlistId
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    var playlist = this.data.playlist;
    return {
      title: playlist ? playlist.name : '歌单分享',
      path: '/pages/playlist-detail/playlist-detail?id=' + this.data.playlistId,
      imageUrl: playlist && playlist.coverUrl ? playlist.coverUrl : ''
    };
  },

  onShareTimeline() {
    var playlist = this.data.playlist;
    return {
      title: playlist ? playlist.name : '歌单分享',
      imageUrl: playlist && playlist.coverUrl ? playlist.coverUrl : ''
    };
  },

  noop() {}
});