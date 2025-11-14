import mongoose from "mongoose";
import bcrypt from "bcryptjs"
const AuthSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})
AuthSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
AuthSchema.methods.isMatch = async function (password) {
    return await bcrypt.compare(password, this.password)
}
export const User = mongoose.model("User", AuthSchema)