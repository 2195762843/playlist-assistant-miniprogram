const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { tagId, name, color } = event;
  const { OPENID } = cloud.getWXContext();

  if (!tagId) {
    return {
      success: false,
      message: '标签ID不能为空'
    };
  }

  if (!name || !name.trim()) {
    return {
      success: false,
      message: '标签名称不能为空'
    };
  }

  try {
    const tag = await db.collection('customTags').doc(tagId).get();
    if (!tag.data || tag.data.openId !== OPENID) {
      return {
        success: false,
        message: '标签不存在或无权修改'
      };
    }

    if (tag.data.name !== name.trim()) {
      const exists = await db.collection('customTags').where({
        openId: OPENID,
        name: name.trim()
      }).get();
      if (exists.data.length > 0) {
        return {
          success: false,
          message: '标签名称已存在'
        };
      }
    }

    const result = await db.collection('customTags').doc(tagId).update({
      data: {
        name: name.trim(),
        color: color || '#4A90E2',
        updateTime: Date.now()
      }
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