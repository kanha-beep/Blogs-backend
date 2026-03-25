import Comment from "../models/CommentsSchema.js";
import ExpressError from "../middlewares/ExpressError.js";

export const isCommentOwner = async (req, res, next) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) return next(new ExpressError(404, "Comment not found"));
    if (comment.user.toString() !== req.user._id.toString()) {
        return next(new ExpressError(403, "Not authorized"));
    }

    next();
};
