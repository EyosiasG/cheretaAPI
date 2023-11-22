const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./init_redis");

module.exports = {
  signAccessTokenCode: (email) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.CODE_ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "10m",
        issuer: process.env.DOMAIN,
        audience: email,
      };
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
        }
        resolve(token);
      });
    });
  },
  verifyAccessTokenCode: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());

    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.CODE_ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
};
