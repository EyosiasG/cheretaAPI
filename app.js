const express = require("express");
const morgan = require("morgan");
const createError = require("http-errors");
require("dotenv").config();
require("./helpers/init_mongodb");
require("./helpers/init_redis");

const userAuthRoute = require("./routes/user.auth.route");
const adminRoute = require("./routes/admin.route");

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res, next) => {
  res.send("hello client i'm an api.");
});

app.use("/admin", adminRoute);

//user authentication route
app.use("/auth", userAuthRoute);

//error handling
app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("main api running on port: " + PORT);
});
