import ExpressError from "../middlewares/ExpressError.js"
import { Blog } from "../models/BlogsSchema.js"
export const recentBlogs = async (req, res, next) => {
    const blog = await Blog.find({})
    const limit = req.query.limit || 3
    const skip = blog.length - limit
    const page = req.query.page || 1
    const blogs = await Blog.find({}).skip(skip).limit(limit).populate("comments")
    if (!blogs) return next(new ExpressError(404, "No blogs found"))
    res.json(blogs)
}
export const allBlogs = async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 3
    const page = parseInt(req.query.page) || 1
    const sort = req.query.sort || "all"
    const skip = (page - 1) * limit
    console.log("page", page, "skip", skip, "limit", limit)
    const filter = {}
    if (sort !== "all") filter.category = sort
    const sortOptions = { createdAt: -1 }
    console.log("sortOptions: ", sortOptions)
    const blogs = await Blog.find(filter).sort(sortOptions).skip(skip).limit(limit).populate("comments")
    const totalBlogs = await Blog.countDocuments(filter)
    if (!blogs) return next(new ExpressError(404, "No blogs found"))
    res.json({ blogs, totalBlogs, page })
}
export const newBlogs = async (req, res, next) => {
    // console.log("new owner: ", req.user)
    const { title, content, author, category } = req.body
    if (!title || !content || !author) return next(new ExpressError(400, "All fields are required"))
    const newBlog = await Blog.create({ title, content, author, image: req.file.filename, category, user: req.user._id })
    console.log("new blog: ", newBlog)
    res.json({ message: "New Blog Created Successfully", newBlog })
}
export const singleBlogs = async (req, res, next) => {
    const { id } = req.params
    const blog = await Blog.findById(id).populate("comments").populate({ path: "user", select: "name" }).populate("user")
    const blogs = await Blog.findById(id)
        .populate({
            path: "comments",           // first populate comments array
            populate: {
                path: "user",             // then populate the user field inside each comment
                select: "name"            // only select the name field from User
            }
        })
        .populate("user", "name");
    if (!blog) return next(new ExpressError(404, "No blog found"))
    res.json(blogs)
}
export const editBlogs = async (req, res, next) => {
    // console.log("req: ", req.params)
    const { id } = req.params
    const blog = await Blog.findById(id)
    console.log("blog to edit: ", blog)
    if (!blog) return next(new ExpressError(404, "No blog found"))
    res.json(blog)
}
export const updateBlogs = async (req, res, next) => {
    const { id } = req.params
    const { title, content, author, category } = req.body
    const existingBlog = await Blog.findById(id).populate("comments")
    const image = req.file ? req.file.filename : existingBlog.image
    console.log("title", title, "content", content, "author", author, "category", category, "image", image)
    const blog = await Blog.findByIdAndUpdate(id, { title, content, author, category, image }, { new: true })
    if (!blog) return next(new ExpressError(404, "No blog found"))
    console.log("updated blog: ", blog)
    res.json({ message: "Updated Successfully", blog })
}
export const deleteBlogs = async (req, res, next) => {
    const { id } = req.params
    const blog = await Blog.findByIdAndDelete(id)
    if (!blog) return next(new ExpressError(404, "No blog found"))
    res.json({ message: "Deleted Successfully" })
}