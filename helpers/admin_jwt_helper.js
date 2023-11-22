const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./init_redis");

module.exports = {
  signAccessTokenAdmin: (adminId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ADMIN_ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "1h",
        issuer: process.env.DOMAIN,
        audience: adminId,
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
  verifyAccessTokenAdmin: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());

    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.ADMIN_ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
  signRefreshTokenAdmin: (adminId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ADMIN_REFRESH_TOKEN_SECRET;
      const options = {
        expiresIn: "1y",
        issuer: process.env.DOMAIN,
        audience: adminId,
      };
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          // reject(err)
          reject(createError.InternalServerError());
        }
        client.SET(
          adminId,
          token,
          "EX",
          process.env.REFRESH_TOKEN_EXP,
          (err, result) => {
            if (err) {
              console.log(err.message);
              reject(createError.InternalServerError());
              return;
            }
            resolve(token);
          }
        );
      });
    });
  },
  verifyRefreshTokenAdmin: (refreshToken) => {
    return new Promise((resolve, reject) => {
      jwt.verify(
        refreshToken,
        process.env.ADMIN_REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized());
          const adminId = payload.aud;
          client.GET(adminId, (err, result) => {
            if (err) {
              console.log(err.message);
              reject(createError.InternalServerError());
              return;
            }
            if (refreshToken === result) return resolve(adminId);
            reject(createError.Unauthorized());
          });
        }
      );
    });
  },
};
