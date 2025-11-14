import jwt from 'jsonwebtoken'
import ExpressError  from '../middlewares/ExpressError.js';
export const VerifyAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.newToken
        if (!token) return next(new ExpressError(401,"Authorization header missing"));
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret")
        // console.log("decoded: ", decoded)
        req.user = decoded;
        next()
    } catch (e) {
        console.log("error in verify: ", e)
    }
}