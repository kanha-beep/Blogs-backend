import express from "express"
// /api/blogs
const router = express.Router()
import { VerifyAuth } from "../middlewares/VerifyAuth.js"
import { WrapAsync } from "../middlewares/WrapAsync.js"
import { writeComments, editComments, deleteComments } from "../controllers/CommentsController.js"
import { isOwner } from "../middlewares/IsOwner.js"
router.post("/:id/comments", VerifyAuth, WrapAsync(writeComments))
router.patch("/:id/comments/:commentId", VerifyAuth,isOwner, WrapAsync(editComments))
router.delete("/:id/comments/:commentId", VerifyAuth,isOwner, WrapAsync(deleteComments))
export default router;