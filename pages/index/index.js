const { PlaylistStorage } = require('../../utils/storage');

Page({
  data: {
    playlists: [],
    displayedPlaylists: [],
    searchKeyword: '',
    isSearching: false,
    isLoading: false,
    userInfo: null
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
    this.loadPlaylists();
  },

  loadUserInfo() {
    var app = getApp();
    var userInfo = app.globalData.userInfo;
    this.setData({ userInfo: userInfo });
  },

  handleUserTap() {
    var that = this;
    var userInfo = this.data.userInfo;
    if (!userInfo) {
      var app = getApp();
      app.login().then(function(result) {
        if (result.success) {
          that.setData({ userInfo: result.data });
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: result.message,
            icon: 'none'
          });
        }
      });
    }
  },

  onPullDownRefresh() {
    this.loadPlaylists();
    wx.stopPullDownRefresh();
  },

  loadPlaylists() {
    var that = this;
    this.setData({ isLoading: true });
    PlaylistStorage.getAll(function(err, playlists) {
      var displayedPlaylists = that.formatPlaylistsForDisplay(playlists);
      that.setData({
        playlists: playlists,
        displayedPlaylists: displayedPlaylists,
        isSearching: false,
        searchKeyword: '',
        isLoading: false
      });
    });
  },

  formatPlaylistsForDisplay(playlists) {
    var that = this;
    return playlists.map(function(playlist) {
      return {
        ...playlist,
        createTimeFormat: that.formatDate(playlist.createTime)
      };
    });
  },

  formatDate(timestamp) {
    if (!timestamp) return '';
    var date = new Date(timestamp);
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '月' + day + '日';
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  onSearch(e) {
    var that = this;
    var keyword = e.detail.value || this.data.searchKeyword;
    if (keyword.trim()) {
      PlaylistStorage.search(keyword, function(err, results) {
        that.setData({
          displayedPlaylists: that.formatPlaylistsForDisplay(results),
          isSearching: true
        });
      });
    } else {
      this.loadPlaylists();
    }
  },

  goToPlaylistDetail(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/playlist-detail/playlist-detail?id=' + id
    });
  },

  goToAddPlaylist() {
    wx.navigateTo({
      url: '/pages/playlist-edit/playlist-edit'
    });
  },

  editPlaylist(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/playlist-edit/playlist-edit?id=' + id
    });
  },

  deletePlaylist(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除歌单"' + name + '"吗？该歌单下的所有歌曲也将被删除。',
      confirmColor: '#FF6B6B',
      success: function(res) {
        if (res.confirm) {
          PlaylistStorage.delete(id, function(err, success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            setTimeout(function() {
              that.loadPlaylists();
            }, 1000);
          });
        }
      }
    });
  },

  togglePin(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    PlaylistStorage.togglePin(id, function(err, isPinned) {
      wx.showToast({
        title: isPinned ? '已置顶' : '已取消置顶',
        icon: 'success'
      });
      that.loadPlaylists();
    });
  },

  onShareAppMessage() {
    return {
      title: '私人歌单整理',
      path: '/pages/index/index',
      imageUrl: ''
    };
  },

  onShareTimeline() {
    return {
      title: '私人歌单整理',
      imageUrl: ''
    };
  },

  noop() {}
});