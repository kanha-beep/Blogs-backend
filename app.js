import dotenv from "dotenv"
dotenv.config()
import cors from "cors"
import express from "express"
import path from "path";
import AuthRoutes from "./routes/AuthRoutes.js"
import BlogsRoutes from "./routes/BlogsRoutes.js"
import CommentsRoutes from "./routes/CommentsRoutes.js"
import { connectDB } from "./utils/db.js"

const app = express()
app.set("trust proxy", 1)
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
connectDB()
app.use("/auth", AuthRoutes)
app.use("/blogs", BlogsRoutes)
app.use("/blogs", CommentsRoutes)

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use((error, req, res, next) => {
  const { status = 500, message = "Something went wrong" } = error;
  res.status(status).json({ message })
})
export default app
