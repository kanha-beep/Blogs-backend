import { Blog } from "../models/BlogsSchema.js";
import ExpressError from "../middlewares/ExpressError.js";
export const isOwner = async (req, res, next) => {
    const blog = await Blog.findById(req.params.id).populate("user")
    if (!blog) return next(new ExpressError(404, "Blog not found"));
    if (!blog.user?._id || blog.user._id.toString() !== req.user._id.toString()) {
        return next(new ExpressError(403, "Not authorized"))
    }

    req.blog = blog;
    next();
}
