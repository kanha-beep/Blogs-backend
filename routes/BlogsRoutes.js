import express from "express"
// /api/blogs
import uploads from "../middlewares/Multer.js"
const router = express.Router()
import { VerifyAuth } from "../middlewares/VerifyAuth.js"
import { WrapAsync } from "../middlewares/WrapAsync.js"
import { newBlogs, allBlogs, recentBlogs, singleBlogs, editBlogs, deleteBlogs, updateBlogs } from "../controllers/BlogsController.js"
import { isOwner } from "../middlewares/IsOwner.js"
router.get("/all", VerifyAuth, WrapAsync(allBlogs))
router.get("/recent", VerifyAuth, WrapAsync(recentBlogs))
router.post("/new", VerifyAuth, uploads.single("image"), WrapAsync(newBlogs))
router.get("/:id/comments", VerifyAuth, WrapAsync(singleBlogs))
router.get("/:id/edit", VerifyAuth,isOwner, WrapAsync(editBlogs))
router.patch("/:id/edit", VerifyAuth, uploads.single("image"), WrapAsync(updateBlogs))
router.delete("/:id/delete", VerifyAuth, WrapAsync(deleteBlogs))
export default router;