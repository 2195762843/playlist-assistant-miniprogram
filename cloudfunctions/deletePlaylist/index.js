const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { playlistId } = event;
  const { OPENID } = cloud.getWXContext();

  if (!playlistId) {
    return {
      success: false,
      message: '歌单ID不能为空'
    };
  }

  try {
    await db.collection('playlists').doc(playlistId).remove();

    await db.collection('songlist').where({
      playlistId: playlistId
    }).remove();

    return {
      success: true,
      message: '删除成功'
    };
  } catch (err) {
    return {
      success: false,
      message: '删除失败',
      error: err.message
    };
  }
};