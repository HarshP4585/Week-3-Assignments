const express = require('express');
const app = express();
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const cors = require("cors")

app.use(express.json());
app.use(bodyParser.json())
app.use(cors())

const adminSecret = "ADMINSecret"
const userSecret = "USERSecret"

let courseIdCounter = 1

function generateJWT(payload, secret) {
  return jwt.sign({
    ...payload, expire: Date.now() + (1 * 3600 * 1000)
  }, secret)
}

function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]
  jwt.verify(token, adminSecret, (err, originalData) => {
    if (err) {
      res.status(403).json({data: "not authenticated"})
    } else {
      if (originalData.expire > Date.now()) {
        fs.readFile("./files/admins.json", "utf-8", (err, data) => {
          if (err) {
            res.status(500).json({data: "internal server error"})
          } else {
            req.user = JSON.parse(data)[originalData.username]
            next()
          }
        })
      } else {
        res.status(400).json({data: "token expired"})
      }
    }
  })
}

function authenticateUser(req, res, next) {
  const token = req.headers.authorization.split(" ")[1]
  jwt.verify(token, userSecret, (err, originalData) => {
    if (err) {
      res.status(403).json({data: "not authenticated"})
    } else {
      if (originalData.expire > Date.now()) {
        fs.readFile("./files/users.json", "utf-8", (err, data) => {
          if (err) {
            res.status(500).json({data: "internal server error"})
          } else {
            req.user = JSON.parse(data)[originalData.username]
            next()
          }
        })
      } else {
        res.json(400).json({data: "token expired"})
      }
    }
  })
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  const {username, password} = req.body
  fs.readFile("./files/admins.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      let admins = JSON.parse(data)
      if (admins[username]) {
        res.status(400).json({data: "admin already exists"})
      } else {
        admins[username] = {username, password}
        fs.writeFile("./files/admins.json", JSON.stringify(admins), (err) => {
          if (err) {
            res.status(500).json({data: "internal server error"})
          } else {
            res.json({data: "admin created"})
          }
        })
      }
    }
  })
});

app.post('/admin/login', (req, res) => {
  const {username, password} = req.headers
  fs.readFile("./files/admins.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      const admins = JSON.parse(data)[username]
      if (admins && admins.password === password) {
        res.json({data: "login successful", token: generateJWT(
          {username}, adminSecret
        )})
      } else {
        res.status(404).json({data: "admin not found"})
      }
    }
  })
});

app.post('/admin/courses', authenticateAdmin, (req, res) => {
  fs.readFile("./files/courses.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      let courses = JSON.parse(data)
      let courseAlreadyExist = Object.entries(courses).find(c => c[1].title === req.body.title)
      if (courseAlreadyExist) {
        res.status(400).json({data: "course already exists"})
      } else {
        courses[courseIdCounter++] = req.body
        fs.writeFile("./files/courses.json", JSON.stringify(courses), (err) => {
          if (err) {
            res.status(500).json({data: "internal server error"})
          } else {
            res.json({data: "course created successfully"})
          }
        })
      }
    }
  })
});

app.put('/admin/courses/:courseId', authenticateAdmin, (req, res) => {
  fs.readFile("./files/courses.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      let courses = JSON.parse(data)
      if (courses[req.params.courseId]) {
        Object.assign(courses[req.params.courseId], req.body)
        fs.writeFile("./files/courses.json", JSON.stringify(courses), (err) => {
          if (err) {
            res.status(500).json({data: "internal server error"})
          } else {
            res.json({data: "course updated"})
          }
        })
      } else {
        res.status(404).json({data: "course not found"})
      }
    }
  })
});

app.get('/admin/courses', authenticateAdmin, (req, res) => {
  fs.readFile("./files/courses.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      res.json(JSON.parse(data))
    }
  })
});

app.get('/admin/courses/:id', authenticateAdmin, (req, res) => {
  fs.readFile("./files/courses.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      res.json(JSON.parse(data)[req.params.id])
    }
  })
});


// User routes
app.post('/users/signup', (req, res) => {
  const {username, password} = req.body
  fs.readFile("./files/users.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      let users = JSON.parse(data)
      if (users[username]) {
        res.status(400).json({data: "user already exists"})
      } else {
        users[username] = {username, password, purchasedCourses: []}
        fs.writeFile("./files/users.json", JSON.stringify(users), (err) => {
          if (err) {
            res.status(500).json({data: "internal server error"})
          } else {
            res.json({data: "user created successfully"})
          }
        })
      }
    }
  })
});

app.post('/users/login', (req, res) => {
  const {username, password} = req.headers
  fs.readFile("./files/users.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      const user = JSON.parse(data)[username]
      if (user && user.password === password) {
        res.json({data: "login successful", token: generateJWT(
          {username}, userSecret
        )})
      } else {
        res.status(404).json({data: "user not found"})
      }
    }
  })
});

app.get('/users/courses', authenticateUser, (req, res) => {
  fs.readFile("./files/courses.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      res.json(
        Object.fromEntries(Object.entries(JSON.parse(data)).filter(c => c[1].published))
      )
    }
  })
});

app.post('/users/courses/:courseId', authenticateUser, (req, res) => {
  fs.readFile("./files/courses.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      const courses = JSON.parse(data)
      if (courses[req.params.courseId] && courses[req.params.courseId].published) {
        fs.readFile("./files/users.json", "utf-8", (err, data) => {
          if (err) {
            res.status(500).json({data: "internal server error"})
          } else {
            let users = JSON.parse(data)
            if (users[req.user.username].purchasedCourses.includes(req.params.courseId)) {
              res.status(400).json({data: "course already purchased"})
            } else {
              users[req.user.username].purchasedCourses.push(req.params.courseId)
  
              fs.writeFile("./files/users.json", JSON.stringify(users), (err) => {
                if (err) {
                  res.status(500).json({data: "internal server error"})
                } else {
                  res.json({data: "course purchased successfully"})
                }
              })
            }
          }
        })
      } else {
        res.status(404).json({data: "course not found"})
      }
    }
  })
});

app.get('/users/purchasedCourses', authenticateUser, (req, res) => {
  fs.readFile("./files/courses.json", "utf-8", (err, data) => {
    if (err) {
      res.status(500).json({data: "internal server error"})
    } else {
      const courses = JSON.parse(data)
      let purchasedCourses = []
      for (const c of req.user.purchasedCourses) {
        purchasedCourses.push(courses[c])
      }
      res.json(purchasedCourses)
    }
  })
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
