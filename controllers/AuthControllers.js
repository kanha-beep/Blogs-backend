import ExpressError from "../middlewares/ExpressError.js"
import { User } from "../models/AuthSchema.js"
import jwt from "jsonwebtoken";
const getJwtSecret = () => process.env.JWT_KEY || process.env.JWT_SECRET;

export const register = async (req, res, next) => {
    const name = req.body?.name?.trim();
    const email = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password;

    if (!email || !password || !name) return next(new ExpressError(404, "Please provide all the required fields"))
    const user = await User.findOne({ email })
    if (user) return next(new ExpressError(404, "User already exists"))
    const newUser = await User.create({ name, email, password })
    res.status(201).json({
        message: "User created successfully",
        user: { _id: newUser._id, name: newUser.name, email: newUser.email }
    })
}
const generateToken = (user) => {
    const secret = getJwtSecret();

    if (!secret) {
        throw new ExpressError(500, "JWT secret is not configured");
    }

    return jwt.sign({ _id: user._id, name: user.name, email: user.email }, secret, { expiresIn: "30d" })
}
export const login = async (req, res, next) => {
    const email = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password;
    if (!email || !password) return next(new ExpressError(400, "Please provide all the required fields"))
    const user = await User.findOne({ email })
    if (!user) return next(new ExpressError(404, "First register"))
    const isValid = await user.isMatch(password)
    if (!isValid) return next(new ExpressError(401, "Wrong password"))
    const token = generateToken(user)
    res.status(200).json({ message: "User logged in successfully", user: { _id: user._id, name: user.name, email: user.email }, token })
}
export const logout = async (req, res, next) => {
    res.status(200).json({ message: "User logged out successfully" })
}
export const currentUser = async (req, res, next) => {
    const user = await User.findById(req.user._id).select("-password")
    if (!user) return next(new ExpressError(404, "User not found"))
    res.status(200).json({ message: "User found", user })
}
