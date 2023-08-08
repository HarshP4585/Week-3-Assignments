const express = require('express');
const app = express();
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken");

// use import
const adminsModel = require("./models/admins.js")
const usersModel = require("./models/users.js")
const coursesModel = require("./models/courses.js")

app.use(express.json());
app.use(bodyParser.json())

const adminSecret = "SecretADMIN"
const userSecret = "SecretUSER"

// what is 0.0.0.0 in ip addr
mongoose.connect("mongodb+srv://hp:nxzIIKbPO448hzRd@course-app.8jckpdp.mongodb.net/courses-db")

// USE DTOs
// https://dev.to/tareksalem/dtos-in-javascript-118p

// Handle Erros -> try-catch for await

function generateJWT(payload, secret) {
  return jwt.sign(
    {...payload, expire: Date.now() + (1 * 3600 * 1000)},
    secret
  )
}

function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization.split(" ")[1]
  jwt.verify(token, adminSecret, async (err, originalData) => {
    if (err) {
      res.status(401).json({data: "not authenticated"})
    } else {
      if (originalData.expire > Date.now()) {
        const user = await adminsModel.findOne({ username: originalData.username })
        req.user = user
        next()
      } else {
        res.status(400).json({data: "token expired"})
      }
    }
  })
}

function authenticateUser(req, res, next) {
  const token = req.headers.authorization.split(" ")[1]
  jwt.verify(token, userSecret, async (err, originalData) => {
    if (err) {
      res.status(401).json("not authenticated")
    } else {
      if (originalData.expire > Date.now()) {
        const user = await usersModel.findOne({ username: originalData.username })
        req.user = user
        next()
      } else {
        res.status(400).json({data: "token expired"})
      }
    }
  })
}

// Admin routes
app.post('/admin/signup', async (req, res) => {
  const {username, password} = req.body
  const admin = await adminsModel.findOne({ username: username })
  
  if (admin) {
    res.status(400).json({data: "admin already exists"})
  } else {
    // create() = new Admin() -> admin.save()
    const newAdmin = await adminsModel.create({username, password})
    res.json({data: "admin created", id: newAdmin._id})
  }
});

app.post('/admin/login', async (req, res) => {
  const {username, password} = req.headers
  const admin = await adminsModel.findOne({ username: username })

  if (admin) {
    if (admin.password === password) {
      res.json({data: "login successful", token: generateJWT(
        {username}, adminSecret
      )})
    } else {
      res.status(401).json({data: "invalid admin credentials"})
    }
  } else {
    res.status(400).json({data: "admin not found"})
  }
});

app.post('/admin/courses', authenticateAdmin, async (req, res) => {
  const course = await coursesModel.create(req.body)
  res.json({data: "course created", id: course._id})
});

app.put('/admin/courses/:courseId', authenticateAdmin, async (req, res) => {
  const course = await coursesModel.findOne({ _id: req.params.courseId })

  if (course) {
    await coursesModel.updateOne({ _id: course._id }, req.body)
    res.json({data: "course updated"})
  } else {
    res.status(400).json({data: "course not found"})
  }
});

app.get('/admin/courses', authenticateAdmin, async (req, res) => {
  const courses = await coursesModel.find({})
  res.json(courses)
});

// User routes
app.post('/users/signup', async (req, res) => {
  const {username, password} = req.body
  const user = await usersModel.findOne({ username: username })
  
  if (user) {
    res.status(400).json({data: "user already exists"})
  } else {
    const newUser = await usersModel.create({username, password})
    res.json({data: "user created", id: newUser._id})
  }
});

app.post('/users/login', async (req, res) => {
  const {username, password} = req.headers
  const user = await usersModel.findOne({ username: username })

  if (user) {
    if (user.password === password) {
      res.json({data: "login successful", token: generateJWT(
        {username}, userSecret
      )})
    } else {
      res.status(401).json({data: "invalid user credentials"})
    }
  } else {
    res.status(404).json({data: "user not found"})
  }
});

app.get('/users/courses', authenticateUser, async (req, res) => {
  const publishedCourses = await coursesModel.find({ published: true }) || []
  res.json(publishedCourses)
});

app.post('/users/courses/:courseId', authenticateUser, async (req, res) => {
  const courseId = req.params.courseId
  const course = await coursesModel.find({ _id: courseId, published: true })
  if (course) {
    let updatedPurchasedCourses = req.user.purchasedCourses

    if (updatedPurchasedCourses.includes(courseId)) {
      res.status(400).json({data: "course already purchased"})
    } else {
      updatedPurchasedCourses.push(courseId)
      await usersModel.updateOne(
        { _id: req.user._id },
        {
          "$set": {
            "purchasedCourses": updatedPurchasedCourses
        }
      })
      res.json({data: "course purchased"})
    }
  } else {
    res.status(404).json({data: "course not found"})
  }
});

app.get('/users/purchasedCourses', authenticateUser, async (req, res) => {
  const purchasedCourses = (await req.user.populate("purchasedCourses"))["purchasedCourses"]
  res.json(purchasedCourses)
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
