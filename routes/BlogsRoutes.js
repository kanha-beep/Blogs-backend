import express from "express"
// /api/blogs
import uploads from "../middlewares/multer.js"
const router = express.Router()
import { VerifyAuth } from "../middlewares/VerifyAuth.js"
import { WrapAsync } from "../middlewares/WrapAsync.js"
import { newBlogs, allBlogs, myBlogs, recentBlogs, singleBlogs, editBlogs, deleteBlogs, updateBlogs, importBlogsFromNews } from "../controllers/BlogsController.js"
import { isOwner } from "../middlewares/IsOwner.js"
router.get("/all", WrapAsync(allBlogs))
router.get("/mine", VerifyAuth, WrapAsync(myBlogs))
router.get("/recent", WrapAsync(recentBlogs))
router.post("/new", VerifyAuth, uploads.single("image"), WrapAsync(newBlogs))
router.post("/import-news", VerifyAuth, WrapAsync(importBlogsFromNews))
router.get("/:id/comments", WrapAsync(singleBlogs))
router.get("/:id/edit", VerifyAuth,isOwner, WrapAsync(editBlogs))
router.patch("/:id/edit", VerifyAuth, isOwner, uploads.single("image"), WrapAsync(updateBlogs))
router.delete("/:id/delete", VerifyAuth, isOwner, WrapAsync(deleteBlogs))
export default router;
