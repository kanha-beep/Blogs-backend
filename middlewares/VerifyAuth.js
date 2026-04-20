import jwt from 'jsonwebtoken'
import ExpressError  from '../middlewares/ExpressError.js';
export const VerifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
            ? authHeader.slice(7).trim()
            : null;
        const token = bearerToken
        if (!token) return next(new ExpressError(401,"Authorization header missing"));
        const secret = process.env.JWT_KEY || process.env.JWT_SECRET;

        if (!secret) {
            return next(new ExpressError(500, "JWT secret is not configured"));
        }

        const decoded = jwt.verify(token, secret)
        req.user = decoded;
        next()
    } catch (e) {
        if (e?.name === "TokenExpiredError") {
            return next(new ExpressError(401, "Session expired. Please log in again."));
        }

        return next(new ExpressError(401, "Invalid token. Please log in again."));
    }
}
