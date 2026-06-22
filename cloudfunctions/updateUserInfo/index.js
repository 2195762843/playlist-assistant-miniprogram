const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { nickName, avatarUrl, gender } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    const exists = await db.collection('users').where({
      openId: OPENID
    }).get();

    const now = Date.now();

    if (exists.data.length > 0) {
      await db.collection('users').doc(exists.data[0]._id).update({
        data: {
          nickName: nickName,
          avatarUrl: avatarUrl,
          gender: gender,
          updateTime: now
        }
      });
    } else {
      await db.collection('users').add({
        data: {
          openId: OPENID,
          nickName: nickName,
          avatarUrl: avatarUrl,
          gender: gender,
          createTime: now,
          updateTime: now
        }
      });
    }

    return {
      success: true,
      message: '保存成功',
      data: {
        openId: OPENID,
        nickName: nickName,
        avatarUrl: avatarUrl,
        gender: gender
      }
    };
  } catch (err) {
    return {
      success: false,
      message: '保存失败',
      error: err.message
    };
  }
};