const AddedReply = require('../../Domains/replies/entities/AddedReply');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(replyData) {
    const { commentId, content, owner, threadId } = replyData;
    const id = `reply-${this._idGenerator()}`;
    const date = new Date().toISOString();

    const query = {
      text: 'INSERT INTO comment_replies (id, content, owner, comment_id, thread_id, date) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, owner',
      values: [id, content, owner, commentId, threadId, date],
    };

    const result = await this._pool.query(query);
    return new AddedReply({ ...result.rows[0] });
  }

  async verifyAvailableReplyById(replyId) {
    const query = {
      text: 'SELECT id FROM comment_replies WHERE id = $1 AND is_delete = false',
      values: [replyId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('REPLY.NOT_FOUND');
    }
  }

  async verifyReplyByOwner(replyId, owner) {
    const query = {
      text: 'SELECT owner FROM comment_replies WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('REPLY.NOT_FOUND');
    }

    if (result.rows[0].owner !== owner) {
      throw new AuthorizationError('REPLY.NOT_AUTHORIZED');
    }
  }

  async getRepliesByThreadId(threadId) {
    const query = {
      text: `SELECT r.id, r.content, r.date, u.username, r.is_delete, r.comment_id
             FROM comment_replies r
             LEFT JOIN users u ON r.owner = u.id
             WHERE r.thread_id = $1
             ORDER BY r.date ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async softDeleteReplyById(replyId) {
    const query = {
      text: 'UPDATE comment_replies SET is_delete = true WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('REPLY.NOT_FOUND');
    }
  }
}

module.exports = ReplyRepositoryPostgres;