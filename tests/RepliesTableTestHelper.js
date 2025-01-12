const pool = require('../src/Infrastructures/database/postgres/pool');

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    content = 'Example Reply',
    owner = 'user-123',
    commentId = 'comment-123',
    threadId = 'thread-123',
    date = new Date().toISOString()
  }) {
    const query = {
      text: 'INSERT INTO comment_replies (id, content, owner, comment_id, thread_id, date) VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, content, owner, commentId, threadId, date],
    };

    await pool.query(query);
  },

  async findReplyById(replyId) {
    const query = {
      text: 'SELECT * FROM comment_replies WHERE id = $1',
      values: [replyId],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comment_replies WHERE 1=1');
  },
};

module.exports = RepliesTableTestHelper;