import ExpressError from "../middlewares/ExpressError.js"
import { Blog } from "../models/BlogsSchema.js"
import cloudinary from "../middlewares/cloudinary.js"
import {
    buildGeneratedContent,
    parseRssFeed,
} from "../utils/newsBlogGenerator.js"

const HINDU_HOME_RSS = "https://www.thehindu.com/feeder/default.rss";
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
export const myBlogs = async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 100
    const page = parseInt(req.query.page) || 1
    const skip = (page - 1) * limit
    const filter = { user: req.user._id }
    const sortOptions = { createdAt: -1 }

    const blogs = await Blog.find(filter).sort(sortOptions).skip(skip).limit(limit).populate("comments")
    const totalBlogs = await Blog.countDocuments(filter)

    if (!blogs) return next(new ExpressError(404, "No blogs found"))
    res.json({ blogs, totalBlogs, page })
}
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "uploads" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        stream.end(buffer);
    });
};
export const newBlogs = async (req, res, next) => {
    const result = req.file ? await uploadToCloudinary(req.file.buffer) : null
    const { title, content, author, category } = req.body
    const normalizedCategory = Array.isArray(category) ? category : [category]

    // if (!title || !content || !author) return next(new ExpressError(400, "All fields are required"))
    const newBlog = await Blog.create({
        title,
        content,
        author,
        url: result?.secure_url,
        category: normalizedCategory,
        user: req.user._id
    })
    res.json({ message: "New Blog Created Successfully", newBlog })
}
export const importBlogsFromNews = async (req, res, next) => {
    const {
        query = "",
        category = "news",
        limit = 5,
        author,
    } = req.body

    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10)
    const endpoint = process.env.NEWS_RSS_URL || HINDU_HOME_RSS

    const response = await fetch(endpoint, {
        headers: {
            Accept: "application/rss+xml, application/xml, text/xml",
        },
    })

    if (!response.ok) {
        const message = await response.text()
        return next(new ExpressError(response.status, message || "Unable to fetch RSS news"))
    }

    const payload = await response.text()
    const articles = parseRssFeed(payload).filter(
        (article) => article?.title || article?.description
    )

    const filteredArticles = query?.trim()
        ? articles.filter((article) =>
            `${article.title} ${article.description}`.toLowerCase().includes(query.trim().toLowerCase())
        )
        : articles

    if (!filteredArticles.length) {
        return next(new ExpressError(404, "No RSS news articles found for blog generation"))
    }

    const importedBlogs = []
    const skippedArticles = []

    for (const article of filteredArticles.slice(0, pageSize)) {
        const sourceTitle = article.title?.trim()
        if (!sourceTitle) {
            skippedArticles.push({ reason: "Missing title" })
            continue
        }

        const exists = await Blog.findOne({
            user: req.user._id,
            sourceTitle,
        })

        if (exists) {
            skippedArticles.push({ title: sourceTitle, reason: "Already imported" })
            continue
        }

        const content = buildGeneratedContent(article)
        const normalizedCategory = Array.isArray(category) ? category : [category]
        const blog = await Blog.create({
            title: sourceTitle,
            content,
            author: author?.trim() || req.user?.name || "Editorial Desk",
            category: normalizedCategory,
            user: req.user._id,
            url: article.urlToImage || article.image_url || "",
            sourceTitle,
            sourceDescription: article.description || "",
            sourceUrl: article.url || article.link || "",
            sourceName: article?.source?.name || article.source_name || "",
            generatedFromNews: true,
            publishedAtSource: article.publishedAt || article.pubDate || null,
        })

        importedBlogs.push(blog)
    }

    res.json({
        message: `${importedBlogs.length} blog(s) created from news`,
        importedBlogs,
        skippedArticles,
    })
}
export const singleBlogs = async (req, res, next) => {
    const { id } = req.params
    console.log("1. start: ", id)
    const blogs = await Blog.findById(id)
        .populate({
            path: "comments",
            populate: {
                path: "user",
                select: "name"
            }
        })
        .populate("user", "name");
    await Blog.populate(blogs, {
        path: "comments.replies.user",
        select: "name"
    });
    if (!blogs) return next(new ExpressError(404, "No blog found"))
    console.log("single: ", blogs)
    res.json(blogs)
}
export const editBlogs = async (req, res, next) => {
    console.log("req: ", req.params)
    const { id } = req.params
    const blog = await Blog.findById(id)
    console.log("blog to edit: ", blog)
    if (!blog) return next(new ExpressError(404, "No blog found"))
    res.json(blog)
}
export const updateBlogs = async (req, res, next) => {
    const { id } = req.params
    const { title, content, author, category } = req.body
    const normalizedCategory = Array.isArray(category) ? category : [category]
    const existingBlog = await Blog.findById(id).populate("comments")
    const image = req.file ? req.file.filename : existingBlog.image
    console.log("title", title, "content", content, "author", author, "category", normalizedCategory, "image", image)
    const blog = await Blog.findByIdAndUpdate(id, { title, content, author, category: normalizedCategory, image }, { new: true })
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
