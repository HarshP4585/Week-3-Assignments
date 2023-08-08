const mongoose = require("mongoose")

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
})

module.exports = admins = mongoose.model("admins", adminSchema)
