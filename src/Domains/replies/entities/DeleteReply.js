class DeleteReply {
  constructor(payload) {
    this._verifyPayload(payload);
    const {
      replyId, commentId, threadId, owner,
    } = payload;
    this.replyId = replyId;
    this.commentId = commentId;
    this.threadId = threadId;
    this.owner = owner;
  }

  _verifyPayload({
    replyId, commentId, threadId, owner,
  }) {
    switch (true) {
      case !replyId || !commentId || !threadId || !owner:
        throw new Error('DELETE_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
      case (typeof replyId !== 'string'
      || typeof commentId !== 'string'
      || typeof threadId !== 'string'
      || typeof owner !== 'string'):
        throw new Error('DELETE_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
      default:
        break;
    }
  }
}

module.exports = DeleteReply;
