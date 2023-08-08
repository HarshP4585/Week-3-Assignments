const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  purchasedCourses: [ {type: mongoose.Schema.Types.ObjectId, ref: "courses"} ]
})

module.exports = mongoose.model("users", userSchema)
