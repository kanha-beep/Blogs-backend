import express from "express"
// /api/auth
const router = express.Router()
import { WrapAsync } from "../middlewares/WrapAsync.js"
import { login, register, currentUser } from "../controllers/AuthControllers.js"
import { VerifyAuth } from "../middlewares/VerifyAuth.js"
router.post("/register", WrapAsync(register))
router.post("/login", WrapAsync(login))
router.post("/logout", (req, res) => {
    res.clearCookie("token")
    res.json({ message: "Logged Out" })
})
router.get("/me",VerifyAuth, WrapAsync(currentUser))
export default router;