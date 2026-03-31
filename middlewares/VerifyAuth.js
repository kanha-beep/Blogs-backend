import jwt from 'jsonwebtoken'
import ExpressError  from '../middlewares/ExpressError.js';
export const VerifyAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.token
        console.log("1.got token: ", token)
        if (!token) return next(new ExpressError(401,"Authorization header missing"));
        const decoded = jwt.verify(token, process.env.JWT_KEY || "your_jwt_secret")
        console.log("decoded: ", decoded)
        req.user = decoded;
        next()
    } catch (e) {
        console.log("error in verify: ", e)
        if (e?.name === "TokenExpiredError") {
            return next(new ExpressError(401, "Session expired. Please log in again."));
        }

        return next(new ExpressError(401, "Invalid token. Please log in again."));
    }
}
