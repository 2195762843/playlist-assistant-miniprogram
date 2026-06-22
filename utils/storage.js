const PlaylistStorage = {
  getAll(callback) {
    wx.cloud.callFunction({
      name: 'getPlaylists',
      success: function(res) {
        if (res.result.success) {
          callback(null, res.result.data);
        } else {
          callback(null, []);
        }
      },
      fail: function(err) {
        console.error('云函数获取歌单失败', err);
        callback(null, wx.getStorageSync('playlists') || []);
      }
    });
  },

  getById(id, callback) {
    this.getAll(function(err, playlists) {
      var playlist = playlists.find(function(p) {
        return p._id === id || p.id === id;
      });
      callback(null, playlist);
    });
  },

  save(playlist, callback) {
    var that = this;
    if (playlist._id || playlist.id) {
      var playlistId = playlist._id || playlist.id;
      wx.cloud.callFunction({
        name: 'updatePlaylist',
        data: {
          playlistId: playlistId,
          name: playlist.name,
          description: playlist.description,
          tags: playlist.tags,
          coverUrl: playlist.coverUrl
        },
        success: function(res) {
          if (res.result.success) {
            that.getById(playlistId, callback);
          } else {
            that.saveLocal(playlist, callback);
          }
        },
        fail: function(err) {
          console.error('云函数更新歌单失败', err);
          that.saveLocal(playlist, callback);
        }
      });
    } else {
      wx.cloud.callFunction({
        name: 'addPlaylist',
        data: {
          name: playlist.name,
          description: playlist.description,
          tags: playlist.tags,
          coverUrl: playlist.coverUrl
        },
        success: function(res) {
          if (res.result.success) {
            callback(null, res.result.data);
          } else {
            that.saveLocal(playlist, callback);
          }
        },
        fail: function(err) {
          console.error('云函数添加歌单失败', err);
          that.saveLocal(playlist, callback);
        }
      });
    }
  },

  saveLocal(playlist, callback) {
    var playlists = wx.getStorageSync('playlists') || [];
    if (playlist._id || playlist.id) {
      var index = playlists.findIndex(function(p) {
        return p._id === playlist._id || p.id === playlist.id;
      });
      if (index !== -1) {
        playlists[index] = { ...playlist, updateTime: Date.now() };
      }
    } else {
      var newPlaylist = {
        ...playlist,
        _id: Date.now().toString(),
        id: Date.now().toString(),
        createTime: Date.now(),
        updateTime: Date.now(),
        isPinned: false,
        songCount: 0
      };
      playlists.unshift(newPlaylist);
    }
    wx.setStorageSync('playlists', playlists);
    callback(null, playlist);
  },

  delete(id, callback) {
    var that = this;
    wx.cloud.callFunction({
      name: 'deletePlaylist',
      data: { playlistId: id },
      success: function(res) {
        if (res.result.success) {
          callback(null, true);
        } else {
          that.deleteLocal(id, callback);
        }
      },
      fail: function(err) {
        console.error('云函数删除歌单失败', err);
        that.deleteLocal(id, callback);
      }
    });
  },

  deleteLocal(id, callback) {
    var playlists = wx.getStorageSync('playlists') || [];
    playlists = playlists.filter(function(p) {
      return p._id !== id && p.id !== id;
    });
    wx.setStorageSync('playlists', playlists);
    callback(null, true);
  },

  togglePin(id, callback) {
    var that = this;
    this.getById(id, function(err, playlist) {
      if (playlist) {
        wx.cloud.callFunction({
          name: 'updatePlaylist',
          data: {
            playlistId: playlist._id || playlist.id,
            isPinned: !playlist.isPinned
          },
          success: function(res) {
            if (res.result.success) {
              callback(null, !playlist.isPinned);
            } else {
              that.togglePinLocal(id, callback);
            }
          },
          fail: function(err) {
            console.error('云函数更新置顶失败', err);
            that.togglePinLocal(id, callback);
          }
        });
      } else {
        callback(null, false);
      }
    });
  },

  togglePinLocal(id, callback) {
    var playlists = wx.getStorageSync('playlists') || [];
    var index = playlists.findIndex(function(p) {
      return p._id === id || p.id === id;
    });
    if (index !== -1) {
      playlists[index].isPinned = !playlists[index].isPinned;
      playlists[index].updateTime = Date.now();
      wx.setStorageSync('playlists', playlists);
      callback(null, !playlists[index].isPinned);
    } else {
      callback(null, false);
    }
  },

  search(keyword, callback) {
    var that = this;
    if (!keyword) {
      this.getAll(callback);
      return;
    }
    wx.cloud.callFunction({
      name: 'getPlaylists',
      data: { keyword: keyword },
      success: function(res) {
        if (res.result.success) {
          callback(null, res.result.data);
        } else {
          that.searchLocal(keyword, callback);
        }
      },
      fail: function(err) {
        console.error('云函数搜索歌单失败', err);
        that.searchLocal(keyword, callback);
      }
    });
  },

  searchLocal(keyword, callback) {
    var playlists = wx.getStorageSync('playlists') || [];
    var lowerKeyword = keyword.toLowerCase();
    var results = playlists.filter(function(p) {
      return p.name.toLowerCase().includes(lowerKeyword) ||
        (p.description && p.description.toLowerCase().includes(lowerKeyword));
    });
    callback(null, results);
  }
};

var presetTags = [
  { name: '华语', color: '#FF6B6B' },
  { name: '欧美', color: '#4ECDC4' },
  { name: '日韩', color: '#45B7D1' },
  { name: '粤语', color: '#FFA07A' },
  { name: '摇滚', color: '#6C5CE7' },
  { name: '流行', color: '#FD79A8' },
  { name: '古典', color: '#A29BFE' },
  { name: '民谣', color: '#00B894' }
];

const TagStorage = {
  presetTags: presetTags,

  getAll(callback) {
    var that = this;
    wx.cloud.callFunction({
      name: 'getCustomTags',
      success: function(res) {
        if (res.result.success) {
          wx.setStorageSync('customTags', res.result.data);
          callback(null, presetTags.concat(res.result.data));
        } else {
          callback(null, presetTags.concat(wx.getStorageSync('customTags') || []));
        }
      },
      fail: function(err) {
        console.error('云函数获取标签失败', err);
        callback(null, presetTags.concat(wx.getStorageSync('customTags') || []));
      }
    });
  },

  getCustomTags(callback) {
    wx.cloud.callFunction({
      name: 'getCustomTags',
      success: function(res) {
        if (res.result.success) {
          wx.setStorageSync('customTags', res.result.data);
          callback(null, res.result.data);
        } else {
          callback(null, wx.getStorageSync('customTags') || []);
        }
      },
      fail: function(err) {
        console.error('云函数获取自定义标签失败', err);
        callback(null, wx.getStorageSync('customTags') || []);
      }
    });
  },

  addCustomTag(tag, callback) {
    var that = this;
    wx.cloud.callFunction({
      name: 'addCustomTag',
      data: {
        name: tag.name,
        color: tag.color
      },
      success: function(res) {
        callback(null, res.result);
      },
      fail: function(err) {
        console.error('云函数添加标签失败', err);
        that.addCustomTagLocal(tag, callback);
      }
    });
  },

  addCustomTagLocal(tag, callback) {
    var customTags = wx.getStorageSync('customTags') || [];
    var newTag = { ...tag, _id: Date.now().toString(), createTime: Date.now(), updateTime: Date.now() };
    customTags.push(newTag);
    wx.setStorageSync('customTags', customTags);
    callback(null, { success: true, message: '添加成功' });
  },

  deleteCustomTag(name, callback) {
    var that = this;
    this.getCustomTags(function(err, customTags) {
      var tag = customTags.find(function(t) {
        return t.name === name;
      });
      if (tag) {
        wx.cloud.callFunction({
          name: 'deleteCustomTag',
          data: { tagId: tag._id },
          success: function(res) {
            if (res.result.success) {
              callback(null, true);
            } else {
              that.deleteCustomTagLocal(name, callback);
            }
          },
          fail: function(err) {
            console.error('云函数删除标签失败', err);
            that.deleteCustomTagLocal(name, callback);
          }
        });
      } else {
        that.deleteCustomTagLocal(name, callback);
      }
    });
  },

  deleteCustomTagLocal(name, callback) {
    var customTags = wx.getStorageSync('customTags') || [];
    customTags = customTags.filter(function(t) {
      return t.name !== name;
    });
    wx.setStorageSync('customTags', customTags);
    callback(null, true);
  },

  updateCustomTag(oldName, newTag, callback) {
    var that = this;
    this.getCustomTags(function(err, customTags) {
      var tag = customTags.find(function(t) {
        return t.name === oldName;
      });
      if (tag) {
        wx.cloud.callFunction({
          name: 'updateCustomTag',
          data: {
            tagId: tag._id,
            name: newTag.name,
            color: newTag.color
          },
          success: function(res) {
            if (res.result.success) {
              callback(null, true);
            } else {
              that.updateCustomTagLocal(oldName, newTag, callback);
            }
          },
          fail: function(err) {
            console.error('云函数更新标签失败', err);
            that.updateCustomTagLocal(oldName, newTag, callback);
          }
        });
      } else {
        that.updateCustomTagLocal(oldName, newTag, callback);
      }
    });
  },

  updateCustomTagLocal(oldName, newTag, callback) {
    var customTags = wx.getStorageSync('customTags') || [];
    var index = customTags.findIndex(function(t) {
      return t.name === oldName;
    });
    if (index !== -1) {
      customTags[index] = { ...newTag, _id: customTags[index]._id, updateTime: Date.now() };
      wx.setStorageSync('customTags', customTags);
      callback(null, true);
    } else {
      callback(null, false);
    }
  }
};

const SettingsStorage = {
  get() {
    return wx.getStorageSync('appSettings') || {
      sortBy: 'createTime',
      sortOrder: 'desc'
    };
  },

  save(settings) {
    wx.setStorageSync('appSettings', settings);
    return settings;
  }
};

const Stats = {
  get(callback) {
    var that = this;
    PlaylistStorage.getAll(function(err, playlists) {
      TagStorage.getCustomTags(function(err2, customTags) {
        wx.cloud.callFunction({
          name: 'getSongs',
          success: function(res) {
            var songs = res.result.success ? res.result.data : [];
            callback(null, {
              totalPlaylists: playlists.length,
              totalSongs: songs.length,
              pinnedPlaylists: playlists.filter(function(p) { return p.isPinned; }).length,
              favoriteSongs: songs.filter(function(s) { return s.isFavorite; }).length,
              tagsCount: presetTags.length + customTags.length
            });
          },
          fail: function(err) {
            console.error('云函数获取歌曲失败', err);
            callback(null, {
              totalPlaylists: playlists.length,
              totalSongs: 0,
              pinnedPlaylists: playlists.filter(function(p) { return p.isPinned; }).length,
              favoriteSongs: 0,
              tagsCount: presetTags.length + customTags.length
            });
          }
        });
      });
    });
  }
};

module.exports = {
  PlaylistStorage,
  TagStorage,
  SettingsStorage,
  Stats
};