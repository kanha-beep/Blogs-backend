import express from "express"
// /api/blogs
const router = express.Router()
import { VerifyAuth } from "../middlewares/VerifyAuth.js"
import { WrapAsync } from "../middlewares/WrapAsync.js"
import { writeComments, editComments, deleteComments, addReply } from "../controllers/CommentsController.js"
import { isCommentOwner } from "../middlewares/IsCommentOwner.js"
router.post("/:id/comments", VerifyAuth, WrapAsync(writeComments))
router.post("/:id/comments/:commentId/replies", VerifyAuth, WrapAsync(addReply))
router.patch("/:id/comments/:commentId", VerifyAuth, isCommentOwner, WrapAsync(editComments))
router.delete("/:id/comments/:commentId", VerifyAuth, isCommentOwner, WrapAsync(deleteComments))
export default router;
