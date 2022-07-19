from django.test import TestCase

from main.views.comment import CommentTree

class FakeComment:
    def __init__(self, id, score, parent_id=None):
        self.id = id
        self.parent_id_id = parent_id
        self.score = score
        self.reddit_score = 0

class CommentTreeTestCase(TestCase):
    def test_can_create_simple_tree(self):
        comments = [FakeComment(1, 3), FakeComment(2, 2, 1), FakeComment(3, 1)]
        commentTree = CommentTree(comments)
        self.assertEqual([x.id for x in commentTree.root], [1, 3])
        self.assertEqual(commentTree.root[0].children[0].next_parent_id, 3)
    def test_sorts_comments(self):
        comments = [FakeComment(1, 3), FakeComment(2, 2, 1), FakeComment(3, 3, 1), FakeComment(4, 5)]
        commentTree = CommentTree(comments)
        self.assertEqual([x.id for x in commentTree.root], [4, 1])
        self.assertEqual([x.id for x in commentTree.root[1].children], [3, 2])
    def test_empty_list(self):
        commentTree = CommentTree([])
        self.assertEqual(commentTree.root, [])