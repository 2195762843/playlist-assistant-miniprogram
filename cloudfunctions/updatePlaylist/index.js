const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { playlistId, name, description, tags, isPinned, coverUrl } = event;
  const { OPENID } = cloud.getWXContext();

  if (!playlistId) {
    return {
      success: false,
      message: '歌单ID不能为空'
    };
  }

  try {
    const updateData = {
      updateTime: Date.now()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (tags !== undefined) updateData.tags = tags;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;

    const result = await db.collection('playlists').doc(playlistId).update({
      data: updateData
    });

    return {
      success: true,
      message: '更新成功',
      data: result
    };
  } catch (err) {
    return {
      success: false,
      message: '更新失败',
      error: err.message
    };
  }
};