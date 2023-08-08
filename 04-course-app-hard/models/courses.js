const mongoose = require("mongoose")

const coursesSchema = new mongoose.Schema({
  title: { type: String, require: true },
  description: { type: String, require: true },
  price: { type: Number, require: true },
  imageLink: { type: String, require: true }, // url validation
  published: { type: Boolean, require: true }
})

module.exports = mongoose.model("courses", coursesSchema)
