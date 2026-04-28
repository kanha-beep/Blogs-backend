import ExpressError from "../middlewares/ExpressError.js"
import { Blog } from "../models/BlogsSchema.js"
import { News } from "../models/NewsSchema.js"
import cloudinary from "../middlewares/cloudinary.js"
import {
    buildGeneratedContent,
    parseRssFeed,
} from "../utils/newsBlogGenerator.js"

const HINDU_HOME_RSS = "https://www.thehindu.com/feeder/default.rss";
export const recentBlogs = async (req, res, next) => {
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 3)
    const blogs = await Blog.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("comments")
    res.json(blogs)
}
export const allBlogs = async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 3
    const page = parseInt(req.query.page) || 1
    const sort = req.query.sort || "all"
    const skip = (page - 1) * limit
    const filter = {}
    if (sort && sort !== "all") filter.category = sort
    const sortOptions = { createdAt: -1 }
    const blogs = await Blog.find(filter).sort(sortOptions).skip(skip).limit(limit).populate("comments")
    const totalBlogs = await Blog.countDocuments(filter)
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
    const { title, content, author, category, sourceUrl } = req.body
    const normalizedCategory = Array.isArray(category)
        ? category.filter(Boolean)
        : [category].filter(Boolean)

    if (!title?.trim() || !content?.trim() || !author?.trim() || normalizedCategory.length === 0) {
        return next(new ExpressError(400, "All fields are required"))
    }

    const result = req.file ? await uploadToCloudinary(req.file.buffer) : null
    const trimmedSourceUrl = sourceUrl?.trim() || ""
    const newBlog = await Blog.create({
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        url: result?.secure_url || "",
        imageUrl: result?.secure_url || "",
        sourceUrl: trimmedSourceUrl,
        sourceTitle: title.trim(),
        category: normalizedCategory,
        user: req.user._id
    })
    if (trimmedSourceUrl) {
        await News.updateOne(
            { $or: [{ link: trimmedSourceUrl }, { title: title.trim() }] },
            { $set: { blogId: newBlog._id } }
        )
    }
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
        const normalizedCategory = Array.isArray(category) ? category.filter(Boolean) : [category].filter(Boolean)
        const blog = await Blog.create({
            title: sourceTitle,
            content,
            author: author?.trim() || req.user?.name || "Editorial Desk",
            category: normalizedCategory,
            user: req.user._id,
            url: article.urlToImage || article.image_url || "",
            imageUrl: article.urlToImage || article.image_url || "",
            sourceTitle,
            sourceDescription: article.description || "",
            sourceUrl: article.url || article.link || "",
            sourceName: article?.source?.name || article.source_name || "",
            generatedFromNews: true,
            publishedAtSource: article.publishedAt || article.pubDate || null,
        })

        if (article.url || article.link) {
            await News.updateOne(
                { link: article.url || article.link },
                { $set: { blogId: blog._id } }
            )
        }

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
    const blogs = await Blog.findById(id)
        .populate({
            path: "comments",
            populate: {
                path: "user",
                select: "name"
            }
        })
        .populate("user", "name");
    if (!blogs) return next(new ExpressError(404, "No blog found"))

    await Blog.populate(blogs, {
        path: "comments.replies.user",
        select: "name"
    });
    res.json(blogs)
}
export const editBlogs = async (req, res, next) => {
    const { id } = req.params
    const blog = await Blog.findById(id)
    if (!blog) return next(new ExpressError(404, "No blog found"))
    res.json(blog)
}
export const updateBlogs = async (req, res, next) => {
    const { id } = req.params
    const { title, content, author, category, sourceUrl } = req.body
    const normalizedCategory = Array.isArray(category)
        ? category.filter(Boolean)
        : [category].filter(Boolean)
    const existingBlog = req.blog || await Blog.findById(id).populate("comments")

    if (!existingBlog) {
        return next(new ExpressError(404, "No blog found"))
    }

    if (!title?.trim() || !content?.trim() || !author?.trim() || normalizedCategory.length === 0) {
        return next(new ExpressError(400, "All fields are required"))
    }

    const uploadedImage = req.file ? await uploadToCloudinary(req.file.buffer) : null
    const nextSourceUrl = sourceUrl?.trim() || existingBlog.sourceUrl || ""
    const blog = await Blog.findByIdAndUpdate(
        id,
        {
            title: title.trim(),
            content: content.trim(),
            author: author.trim(),
            category: normalizedCategory,
            url: uploadedImage?.secure_url || existingBlog.url || "",
            imageUrl: uploadedImage?.secure_url || existingBlog.imageUrl || existingBlog.url || "",
            sourceUrl: nextSourceUrl,
            sourceTitle: title.trim(),
        },
        { new: true }
    )
    if (!blog) return next(new ExpressError(404, "No blog found"))
    if (nextSourceUrl) {
        await News.updateOne(
            { $or: [{ link: nextSourceUrl }, { title: title.trim() }] },
            { $set: { blogId: blog._id } }
        )
    }
    res.json({ message: "Updated Successfully", blog })
}
export const deleteBlogs = async (req, res, next) => {
    const { id } = req.params
    const blog = await Blog.findByIdAndDelete(id)
    if (!blog) return next(new ExpressError(404, "No blog found"))
    res.json({ message: "Deleted Successfully" })
}

