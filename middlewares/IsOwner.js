import { Blog } from "../models/BlogsSchema.js";
import ExpressError from "../middlewares/ExpressError.js";
export const isOwner = async (req,res,next) => {
    console.log("user owner: ", req.user)
    const blog = await Blog.findById(req.params.id).populate("user")
    if (!blog) return next(new ExpressError(404, "Blog not found"));
    if (!blog.user._id.equals(req.user._id)) return next(new ExpressError(404, "Not authorized"))
    console.log("current user: ", req.user._id);
    console.log("blog owner: ", blog.user._id)
}