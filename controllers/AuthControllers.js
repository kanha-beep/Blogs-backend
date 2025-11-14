import ExpressError from "../middlewares/ExpressError.js"
import { User } from "../models/AuthSchema.js"
import jwt from "jsonwebtoken";
export const register = async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return next(new ExpressError(404, "Please provide all the required fields"))
    // console.log("all details done", name, email, password)
    const user = await User.findOne({ email })
    // console.log("user found: ", user)
    if (user) return next(new ExpressError(404, "User already exists"))
    const newUser = await User.create({ name, email, password })
    // console.log("new user created: ", newUser)
    res.status(200).json({ message: "User created successfully" })
}
const generateToken = (user) => {
    return jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_KEY || "your_jwt_secret", { expiresIn: "30d" })
}
export const login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return next(new ExpressError(400, "Please provide all the required fields"))
    // console.log("all details done", email, password)
    const user = await User.findOne({ email })
    if (!user) return next(new ExpressError(404, "First register"))
    // console.log("user found: ", user)
    const isValid = await user.isMatch(password)
    if (!isValid) return next(new ExpressError(401, "Wrong password"))
    // console.log("password matched")
    const token = generateToken(user)
    console.log("token generated: ", token)
    res.cookie("newToken", token, { httpOnly: true, secure: false })
    res.status(200).json({ message: "User created successfully", user: { _id: user._id, name: user.name, email: user.email }, token })
}
export const logout = async (req, res, next) => {
    res.clearCookie("newToken")
    res.status(200).json({ message: "User logged out successfully" })
}
export const currentUser = async (req, res, next) => {
    const user = await User.findById(req.user._id).select("-password")
    // const token = req.cookies.newToken
    // if (!token) return next(new ExpressError(401, "Please login first"))
    // const decoded = jwt.verify(token, process.env.JWT_KEY || "your_jwt_secret")
    // const user = await User.findById(decoded.id)

    if (!user) return next(new ExpressError(404, "User not found"))
    res.status(200).json({ message: "User found", user })
}