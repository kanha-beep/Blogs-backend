import Comment from "../models/CommentsSchema.js"
import { Blog } from "../models/BlogsSchema.js"
import ExpressError from "../middlewares/ExpressError.js"
export const writeComments = async (req, res, next) => {
    const { id } = req.params
    const { content, rating } = req.body;
    const normalizedRating = Math.min(5, Math.max(1, Number(rating) || 5))
    const comments = await Comment.create({
        content,
        rating: normalizedRating,
        user: req?.user?._id,
        blog: id
    })
    const blog = await Blog.findByIdAndUpdate(id, { $push: { comments: comments._id } }, { new: true }).populate("comments")
    if (!blog) return next(new ExpressError(404, "No blog found"))
    res.json(blog)
}
export const addReply = async (req, res, next) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!content?.trim()) return next(new ExpressError(400, "Reply content is required"))

    const comment = await Comment.findById(commentId)
    if (!comment) return next(new ExpressError(404, "No comment found"))

    comment.replies.push({
        content: content.trim(),
        user: req?.user?._id,
    })

    await comment.save()
    await comment.populate("replies.user", "name")

    res.json(comment)
}
export const editComments = async (req, res, next) => {
    const { id, commentId } = req.params
    const { content, rating } = req.body
    const normalizedRating = Math.min(5, Math.max(1, Number(rating) || 5))
    const comments = await Comment.findByIdAndUpdate(
        commentId,
        { content, rating: normalizedRating },
        { new: true }
    )
    if (!comments) return next(new ExpressError(404, "No comment found"))
    res.json(comments)
}
export const deleteComments = async (req, res, next) => {
    const { id, commentId } = req.params
    const comments = await Comment.findByIdAndDelete(commentId)
    if (!comments) return next(new ExpressError(404, "No comment found"))
    await Blog.findByIdAndUpdate(id, { $pull: { comments: commentId } })
    res.json({ message: "Deleted Successfully" })
}
