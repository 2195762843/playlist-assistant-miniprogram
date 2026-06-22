const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { name, description, tags, coverUrl } = event;
  const { OPENID } = cloud.getWXContext();

  if (!name || !name.trim()) {
    return {
      success: false,
      message: '歌单名称不能为空'
    };
  }

  try {
    const now = Date.now();
    const result = await db.collection('playlists').add({
      data: {
        name: name.trim(),
        description: description ? description.trim() : '',
        tags: tags || [],
        coverUrl: coverUrl || '',
        isPinned: false,
        songCount: 0,
        createTime: now,
        updateTime: now,
        openId: OPENID
      }
    });

    return {
      success: true,
      message: '创建成功',
      data: {
        _id: result._id,
        name: name.trim(),
        description: description ? description.trim() : '',
        tags: tags || [],
        coverUrl: coverUrl || '',
        isPinned: false,
        songCount: 0,
        createTime: now,
        updateTime: now,
        openId: OPENID
      }
    };
  } catch (err) {
    return {
      success: false,
      message: '创建失败',
      error: err.message
    };
  }
};