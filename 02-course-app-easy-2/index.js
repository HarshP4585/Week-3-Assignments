const express = require('express');
const app = express();
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")

const adminSecret = "AdminSecret"
const userSecret = "UserSecret"

app.use(express.json());
app.use(bodyParser.json())

function generateJWT(payload, secret) {
  return jwt.sign(
    {...payload, expire: Date.now() + (1 * 60 * 60 * 1000)},
    secret
  )
}

// generalized authenticate for admin and user
function authenticate(secret, DATA, req, res, next) {
  const token = req.headers.authorization.split(" ")[1]
  jwt.verify(token, secret, (err, data) => {
    if (err) {
      res.status(403).json({data: "not authenticated"})
    } else {
      if (data.expire > Date.now()) {
        let user = DATA.find(adm => adm.username === data.username)
        req.user = user
        next()
      } else {
        res.status(400).json({data: "token expired"})
      }
    }
  })
}

function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization.split(" ")[1]
  jwt.verify(token, adminSecret, (err, data) => {
    if (err) {
      res.status(403).json({data: "not authenticated"})
    } else {
      if (data.expire > Date.now()) {
        let admin = ADMINS.find(adm => adm.username === data.username)
        req.user = admin
        next()
      } else {
        res.status(400).json({data: "token expired"})
      }
    }
  })
}

function authenticateUser(req, res, next) {
  const token = req.headers.authorization.split(" ")[1]
  jwt.verify(token, userSecret, (err, data) => {
    if (err) {
      res.status(403).json({data: "not authenticated"})
    } else {
      if (data.expire > Date.now()) {
        let user = USERS.find(adm => adm.username === data.username)
        req.user = user
        next()
      } else {
        res.status(400).json({data: "token expired"})
      }
    }
  })
}

let ADMINS = [];
let USERS = [];
let COURSES = [];
let courseIdCtr = 1

// Admin routes
app.post('/admin/signup', (req, res) => {
  const {username, password} = req.body
  let admin = ADMINS.find(adm => adm.username === username)

  if (admin) {
    res.status(400).json({data: "admin already exists"})
  } else {
    ADMINS.push({username, password})
    res.json({data: "admin created successfully"})
  }
});

app.post('/admin/login', (req, res) => {
  const {username, password} = req.headers
  let admin = ADMINS.find(adm => adm.username === username && adm.password === password)

  if (admin) {
    res.json({data: "login successful", token: generateJWT(
      {username}, adminSecret
    )})
  } else {
    res.status(404).json({data: "admin not found"})
  }
});

app.post('/admin/courses', authenticateAdmin, (req, res) => {
  const course = COURSES.find(c => c.title === req.body.title)
  if (course) {
    res.status(400).json({data: "course already exists"})
  } else {
    const courseId = courseIdCtr++
    let newCourse = {}
    Object.assign(newCourse, req.body)
    COURSES.push({courseId, ...newCourse})
    res.json({data: "course created successfully", courseId: courseId})
  }
});

app.put('/admin/courses/:courseId', authenticateAdmin, (req, res) => {
  let course = COURSES.find(c => c.courseId === parseInt(req.params.courseId))

  if (course) {
    // update by reference
    Object.assign(course, req.body)
    res.json({data: "course updated successfully"})
  } else {
    res.status(404).json({data: "course not found"})
  }
});

app.get('/admin/courses', authenticateAdmin, (req, res) => {
  res.json(COURSES)
});

// User routes
app.post('/users/signup', (req, res) => {
  const {username, password} = req.body
  const user = USERS.find(u => u.username === username)

  if (user) {
    res.status(400).json({data: "user already exists"})
  } else {
    USERS.push({username, password, purchasedCourses: []})
    res.json({daat: "user created successfully"})
  }
});

app.post('/users/login', (req, res) => {
  const {username, password} = req.headers
  const user = USERS.find(u => u.username === username && u.password === password)

  if (user) {
    res.json({data: "login successful", token: generateJWT(
      {username}, userSecret
    )})
  } else {
    res.status(404).json({data: "user not found"})
  }
});

app.get('/users/courses', authenticateUser, (req, res) => {
  let publishedCourses = COURSES.filter(c => c.published)
  res.json(publishedCourses)
});

app.post('/users/courses/:courseId', authenticateUser, (req, res) => {
  const course = COURSES.find(c => c.courseId === parseInt(req.params.courseId) && c.published)

  if (course) {
    // next step: store courseId
    req.user.purchasedCourses.push(course)
    res.json({data: `purchased course ${course.courseId}`})
  } else {
    res.status(404).json({data: "course not found"})
  }
});

app.get('/users/purchasedCourses', authenticateUser, (req, res) => {
  res.json(req.user.purchasedCourses)
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
