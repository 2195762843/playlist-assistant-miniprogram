const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  try {
    const result = await db.collection('users').where({
      openId: OPENID
    }).get();

    if (result.data.length > 0) {
      return {
        success: true,
        message: '获取成功',
        data: result.data[0]
      };
    } else {
      return {
        success: false,
        message: '用户不存在',
        data: null
      };
    }
  } catch (err) {
    return {
      success: false,
      message: '获取失败',
      error: err.message
    };
  }
};