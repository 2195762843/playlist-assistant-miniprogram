const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { songId, name, artist, album, mood, tags, isFavorite } = event;

  if (!songId) {
    return {
      success: false,
      message: '歌曲ID不能为空'
    };
  }

  try {
    const updateData = {
      updateTime: Date.now()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (artist !== undefined) updateData.artist = artist.trim();
    if (album !== undefined) updateData.album = album.trim();
    if (mood !== undefined) updateData.mood = mood.trim();
    if (tags !== undefined) updateData.tags = tags;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const result = await db.collection('songlist').doc(songId).update({
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