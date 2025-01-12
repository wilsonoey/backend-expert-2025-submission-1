const CommentTableTestHelper = require("../../../../tests/CommentsTableTestHelper");
const ThreadTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const AuthorizationError = require("../../../Commons/exceptions/AuthorizationError");
const NotFoundError = require("../../../Commons/exceptions/NotFoundError");
const AddedComment = require("../../../Domains/comments/entities/AddedComment");
const NewComment = require("../../../Domains/comments/entities/AddComment");
const pool = require("../../database/postgres/pool");
const CommentRepositoryPostgres = require("../CommentRepositoryPostgres");

describe("CommentRepositoryPostgres", () => {
  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: "user-123", username: "ardi" });
    await ThreadTableTestHelper.addThread({
      id: "thread-123",
      owner: "user-123",
    });
  });

  afterEach(async () => {
    await CommentTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await ThreadTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("addComment function", () => {
    it("should persist new comment and return added comment correctly", async () => {
      // Arrange
      const newComment = new NewComment({
        content: "Comment content test",
        owner: "user-123",
        threadId: "thread-123",
      });

      const fakeIdGenerator = () => "123";
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      // Action
      await commentRepositoryPostgres.addComment(newComment);

      // Assert
      const comments =
        await CommentTableTestHelper.findCommentByIdIsDeleteFalse(
          "comment-123"
        );
      expect(comments).toHaveLength(1);
    });

    it("should return added comment correctly", async () => {
      // Arrange
      const newComment = new NewComment({
        content: "Comment content test",
        owner: "user-123",
        threadId: "thread-123",
      });

      const fakeIdGenerator = () => "123";
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(
        newComment
      );

      // Assert
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: "comment-123",
          content: "Comment content test",
          owner: "user-123",
        })
      );
    });
  });

  describe("verifyAvailableComment function", () => {
    it("should throw NotFoundError when comment and thread not found", async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => {}
      );

      // Action and Assert
      await expect(
        commentRepositoryPostgres.verifyAvailableComment(
          "comment-123",
          "thread-123"
        )
      ).rejects.toThrowError(NotFoundError);
    });

    it("should not throw NotFoundError when comment and thread found", async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: "comment-123",
        threadId: "thread-123",
        owner: "user-123",
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => {}
      );

      // Action and Assert
      await expect(
        commentRepositoryPostgres.verifyAvailableComment(
          "comment-123",
          "thread-123"
        )
      ).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe("verifyOwnerComment function", () => {
    it("should throw AuthorizationError when comment have invalid owner", async () => {
      // Arrange
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => {}
      );

      // Action and Assert
      await expect(
        commentRepositoryPostgres.verifyOwnerComment(
          "comment-123",
          "invalid-user"
        )
      ).rejects.toThrowError(AuthorizationError);
    });

    it("should not throw AuthorizationError when comment have valid owner", async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: "comment-123",
        threadId: "thread-123",
        owner: "user-123",
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => {}
      );

      // Action and Assert
      await expect(
        commentRepositoryPostgres.verifyOwnerComment("comment-123", "user-123")
      ).resolves.not.toThrowError(AuthorizationError);
    });
  });

  describe("deleteCommentByCommentId function", () => {
    it("should delete comment by comment id correctly", async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: "comment-123",
        owner: "user-123",
        threadId: "thread-123",
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => {}
      );

      // Action
      await commentRepositoryPostgres.deleteCommentByCommentId("comment-123");

      // Assert
      const comments =
        await CommentTableTestHelper.findCommentByIdIsDeleteFalse(
          "comment-123"
        );
      expect(comments).toHaveLength(0);
    });
  });

  describe("getCommentsByThreadId function", () => {
    it("should return empty array when not found comment in thread", async () => {
      // Arrange
      const threadId = "thread-123";
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => {}
      );

      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId(
        threadId
      );

      // Assert
      expect(comments).toHaveLength(0);
    });

    // Update the test case for comparing dates
    it('should return all comment by thread id correctly', async () => {
      // Arrange
      const date1 = new Date();
      const date2 = new Date();
      date2.setMinutes(date2.getMinutes() + 1);
      
      const exampleComment1 = {
        id: 'comment-123',
        owner: 'user-123',
        threadId: 'thread-123',
        content: 'Comment content test',
        date: date1,
      };
    
      const exampleComment2 = {
        id: 'comment-124',
        owner: 'user-123',
        threadId: 'thread-123',
        content: 'Comment content test',
        date: date2,
      };
    
      await CommentTableTestHelper.addComment(exampleComment1);
      await CommentTableTestHelper.addComment(exampleComment2);
    
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, () => {});
    
      // Action
      const comments = await commentRepositoryPostgres.getCommentsByThreadId('thread-123');
      const mappedComments = comments.map(comment => ({
        ...comment,
        username: 'ardi',
      }));
    
      // Assert
      expect(mappedComments).toHaveLength(2);
      expect(mappedComments[0]).toHaveProperty('id', exampleComment1.id);
      expect(mappedComments[0]).toHaveProperty('content', exampleComment1.content);
      expect(mappedComments[0]).toHaveProperty('username', 'ardi');
      expect(mappedComments[0]).toHaveProperty('is_delete');
      expect(mappedComments[0]).toHaveProperty('date');
    });
  });
});
