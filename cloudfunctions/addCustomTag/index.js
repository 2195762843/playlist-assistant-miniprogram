const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { name, color } = event;
  const { OPENID } = cloud.getWXContext();

  if (!name || !name.trim()) {
    return {
      success: false,
      message: '标签名称不能为空'
    };
  }

  try {
    const exists = await db.collection('customTags').where({
      openId: OPENID,
      name: name.trim()
    }).get();

    if (exists.data.length > 0) {
      return {
        success: false,
        message: '标签已存在'
      };
    }

    const countResult = await db.collection('customTags').where({
      openId: OPENID
    }).count();

    if (countResult.total >= 10) {
      return {
        success: false,
        message: '自定义标签最多10个'
      };
    }

    const now = Date.now();
    const result = await db.collection('customTags').add({
      data: {
        name: name.trim(),
        color: color || '#4A90E2',
        createTime: now,
        updateTime: now,
        openId: OPENID
      }
    });

    return {
      success: true,
      message: '添加成功',
      data: {
        _id: result._id,
        name: name.trim(),
        color: color || '#4A90E2',
        createTime: now,
        updateTime: now,
        openId: OPENID
      }
    };
  } catch (err) {
    return {
      success: false,
      message: '添加失败',
      error: err.message
    };
  }
};