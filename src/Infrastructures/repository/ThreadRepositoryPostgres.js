const AddedThread = require('../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async verifyAvailableThreadById(threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    // console.log(result);

    if (!result.rowCount) {
      throw new NotFoundError('THREAD.NOT_FOUND di database');
    }
  }

  async addThread(threadData) {
    const { title, body, owner } = threadData;
    const id = `thread-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO threads (id, title, body, owner) VALUES($1, $2, $3, $4) RETURNING id, title, owner as owner',
      values: [id, title, body, owner],
    };

    const result = await this._pool.query(query);

    // console.log(result);

    return new AddedThread({ ...result.rows[0] });
  }

  async getThreadById(threadId) {
    const query = {
      text: `SELECT threads.id, threads.title, threads.body, threads.date, users.username 
              FROM threads 
              LEFT JOIN users ON (threads.owner = users.id) 
              WHERE threads.id = $1`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    // console.log(result);

    if (!result.rowCount) {
      throw new NotFoundError('THREAD.NOT_FOUND di database');
    }

    return result.rows[0];
  }
}

module.exports = ThreadRepositoryPostgres;
