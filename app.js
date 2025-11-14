import dotenv from "dotenv"
dotenv.config()
import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import path from "path";
import AuthRoutes from "./routes/AuthRoutes.js"
import BlogsRoutes from "./routes/BlogsRoutes.js"
import { connectDB } from "./utils/db.js"
const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieParser())
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
connectDB()
app.use("/api/auth", AuthRoutes)
app.use("/api/blogs", BlogsRoutes)
app.use((error, req, res, next) => {
    const { status = 500, message = "Something went wrong" } = error;
    res.status(status).json({ message })
})
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
export default app