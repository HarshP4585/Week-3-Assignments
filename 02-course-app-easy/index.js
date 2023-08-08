const express = require('express');
const app = express();
const bodyParser = require("body-parser")

let courseIdCounter = 1

app.use(express.json());
app.use(bodyParser.json())

let ADMINS = [];
let USERS = [];
let COURSES = [];

// Use route specific middleware for authentication

// Admin routes
app.post('/admin/signup', (req, res) => {
  const username = req.body.username
  const password = req.body.password
  let found = false
  for (admin of ADMINS) {
    if (admin.username === username) {
      found = true
      break
    }
  }
  if (found) {
    res.status(400).json({data: "username already exists"})
  } else {
    ADMINS.push({username, password})
    res.json({data: "admin created"})
  }
});

app.post('/admin/login', (req, res) => {
  const username = req.headers.username
  const password = req.headers.password
  let found = false

  for (admin of ADMINS) {
    if (admin.username === username && admin.password === password) {
      found = true
      break
    }
  }
  if (found) {
    res.json({data: "login successful"})
  } else {
    res.status(404).json({data: "admin not found"})
  }
});

app.post('/admin/courses', (req, res) => {
  const username = req.headers.username
  const password = req.headers.password
  let adminFound = false

  for (admin of ADMINS) {
    if (admin.username === username && admin.password === password) {
      adminFound = true
      break
    }
  }
  if (adminFound) {
    const title = req.body.title
    const description = req.body.description
    const price = req.body.price
    // const imageLink = req.body.imageLink
    const isPublished = req.body.published
    let courseFound = false

    for (course of COURSES) {
      if (course.title === title) {
        courseFound = true
        break
      }
    }
    if (courseFound) {
      res.status(400).json({data: "course already exists"})
    } else {
      const courseId = courseIdCounter++

      COURSES.push({courseId, title, description, price, isPublished})
      res.json({data: "course created successfully"})
    }
  } else {
    res.status(404).json({data: "admin not found"})
  }
});

app.put('/admin/courses/:courseId', (req, res) => {
  const username = req.headers.username
  const password = req.headers.password
  let adminFound = false

  for (let admin of ADMINS) {
    if (admin.username === username && admin.password === password) {
      adminFound = true
      break
    }
  }
  if (adminFound) {
    let courseId = req.params.courseId
    let courseFound = false

    for (let course of COURSES) {
      if (course.courseId == courseId) {
        // Optimise this
        course.title = req.body.title
        course.description = req.body.description
        course.price = req.body.price
        course.isPublished = req.body.published
        courseFound = true
        break
      }
    }
    if (courseFound) {
      res.json({data: "course update successfully"})
    } else {
      res.status(404).json({data: "course not found"})
    }

  } else {
    res.status(404).json({data: "admin not found"})
  }
});

app.get('/admin/courses', (req, res) => {
  const username = req.headers.username
  const password = req.headers.password
  let found = false

  for (let admin of ADMINS) {
    if (admin.username === username && admin.password === password) {
      found = true
      break
    }
  }
  if (found) {
    res.json(COURSES)
  } else {
    res.status(404).json({data: "admin not found"})
  }
});

// User routes
app.post('/users/signup', (req, res) => {
  const username = req.body.username
  const password = req.body.password
  let found = false

  for (user of USERS) {
    if (user.username === username) {
      found = true
    }
  }
  if (found) {
    res.status(400).json({data: "username already exists"})
  } else {
    USERS.push({username, password, purchasedCourse: []})
    res.json({data: "user created"})
  }
});

app.post('/users/login', (req, res) => {
  const username = req.headers.username
  const password = req.headers.password
  let found = false

  for (user of USERS) {
    if (user.username === username && user.password === password) {
      found = true
      break
    }
  }
  if (found) {
    res.json({data: "login successful"})
  } else {
    res.status(404).json({data: "user not found"})
  }
});

app.get('/users/courses', (req, res) => {
  const username = req.headers.username
  const password = req.headers.password
  let found = false

  for (let user of USERS) {
    if (user.username === username && user.password === password) {
      found = true
      break
    }
  }
  if (found) {
    let publishedCourses = []

    for (let course of COURSES) {
      if (course.isPublished) {
        publishedCourses.push(course)
      }
    }
    res.json(publishedCourses)
  } else {
    res.status(404).json({data: "user not found"})
  }
});

app.post('/users/courses/:courseId', (req, res) => {
  const username = req.headers.username
  const password = req.headers.password
  let userFound = false
  let userIndex = -1

  for (user of USERS) {
    ++userIndex
    if (user.username === username && user.password === password) {
      userFound = true
      break
    }
  }
  if (userFound) {
    const courseId = req.params.courseId
    let courseFound = false
    let courseIndex = -1

    for (course of COURSES) {
      ++courseIndex
      if (course.courseId == courseId && course.isPublished) {
        courseFound = true
        break
      }
    }
    if (courseFound) {
      let alreadyPurchased = false
      for (course of USERS[userIndex].purchasedCourse) {
        if (course.courseId === courseId) {
          alreadyPurchased = true
        }
      }
      if (alreadyPurchased) {
        res.status(400).json({data: "course already purchased"})
      } else {
        // store the course id instead of full course object
        USERS[userIndex].purchasedCourse.push(COURSES[courseIndex])
        res.json({data: "course purchased successfully"})
      }
    } else {
      res.status(404).json({data: "course not found"})
    }
  } else {
    res.status(404).json({data: "user not found"})
  }
});

app.get('/users/purchasedCourses', (req, res) => {
  const username = req.headers.username
  const password = req.headers.password
  let found = false
  let index = -1

  for (user of USERS) {
    ++index
    if (user.username === username && user.password === password) {
      found = true
    }
  }
  if (found) {
    // find the course based on stored course ids
    res.json(USERS[index].purchasedCourse)
  } else {
    res.status(404).json({data: "user not found"})
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
