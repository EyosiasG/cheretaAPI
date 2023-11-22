const createError = require("http-errors");
const bcrypt = require("bcrypt");
const { promisify } = require("util");
const User = require("../models/user.model");
const {
  userauthSchema,
  loginSchema,
  userSchema,
  userPasswordSchema,
  disableSchema,
  codeSchema,
  verificationSchema,
} = require("../helpers/validation_schema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");
const client = require("../helpers/init_redis");
const mailer = require("../helpers/email");
const { signAccessTokenCode } = require("../helpers/code_jwt_helpter");

module.exports = {
  register: async (req, res, next) => {
    try {
      const result = await userauthSchema.validateAsync(req.body);
      const email = req.payload["aud"];
      const doesExist = await User.findOne({ email: email });
      if (doesExist)
        throw createError.Conflict(email + " is already registered");
      const getAsync = promisify(client.get).bind(client);

      getAsync(email)
        .then(async (code) => {
          if (code != "true")
            throw createError.Unauthorized(email + " is not verified!");
          else {
            client.DEL(email, (err, val) => {
              if (err) {
                console.log(err.message);
                throw createError.InternalServerError();
              }
            });

            const user = new User({
              first_name: result.first_name,
              middle_name: result.middle_name,
              last_name: result.last_name,
              phonenumber: result.phonenumber,
              password: result.password,
              email: email,
              status: true,
            });

            const savedUser = await user.save();
            const accessToken = await signAccessToken(savedUser.id);
            const refreshToken = await signRefreshToken(savedUser.id);
            res.send({ accessToken, refreshToken });
          }
        })
        .catch((err) => {
          next(err);
        });
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  login: async (req, res, next) => {
    try {
      const result = await loginSchema.validateAsync(req.body);
      const user = await User.findOne({ email: result.email });

      if (!user) throw createError.Unauthorized("Invalid Username/Password");

      const isMatch = await user.isValidPassword(result.password);

      if (!isMatch || !user.status)
        throw createError.Unauthorized("Invalid Username/Password");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);
      res.send({ accessToken, refreshToken });
    } catch (err) {
      if (err.isJoi === true)
        return next(createError.BadRequest("Invalid Username/Password"));
      next(err);
    }
  },
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const userId = await verifyRefreshToken(refreshToken);

      const accessToken = await signAccessToken(userId);
      const newRefreshToken = await signRefreshToken(userId);
      res.send({ accessToken: accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const userId = await verifyRefreshToken(refreshToken);
      client.DEL(userId, (err, val) => {
        if (err) {
          console.log(err.message);
          throw createError.InternalServerError();
        }
        console.log(val);
        res.sendStatus(204);
      });
    } catch (error) {
      next(error);
    }
  },
  UpdateUserInfo: async (req, res, next) => {
    try {
      const result = await userSchema.validateAsync(req.body);
      const userid = req.payload["aud"];
      await User.findByIdAndUpdate(userid, result);
      res.send();
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  DisableUserAcc: async (req, res, next) => {
    try {
      const result = await disableSchema.validateAsync(req.body);
      const user = await User.findOne({ email: result.email });
      await User.findByIdAndUpdate(user.id, { status: false });
      client.DEL(user.id, (err, val) => {
        if (err) {
          console.log(err.message);
          throw createError.InternalServerError();
        }
      });
      res.send();
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  EnableUserAcc: async (req, res, next) => {
    try {
      const result = await disableSchema.validateAsync(req.body);
      const user = await User.findOne({ email: result.email });
      await User.findByIdAndUpdate(user.id, { status: true });
      res.send();
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  UpdateUserPass: async (req, res, next) => {
    try {
      const result = await userPasswordSchema.validateAsync(req.body);
      const userid = req.payload["aud"];
      const user = await User.findById(userid);

      if (!user) {
        console.log("CHANGE ACCESS TOKEN AND REFRESH TOKEN ASAP!!!!!!!");
        console.log("HACKER ALERT!!!!!!!");
        throw createError.InternalServerError();
      }

      const isMatch = await user.isValidPassword(result.oldPassword);

      if (!isMatch) throw createError.Unauthorized("Invalid Password");
      if (result.password == result.oldPassword) throw createError.BadRequest();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(result.password, salt);
      result.password = hashedPassword;

      await User.findByIdAndUpdate(userid, { password: result.password });
      res.send();
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  GetUserData: async (req, res, next) => {
    try {
      const userid = req.payload["aud"];
      const user = await User.findById(userid);

      if (!user) {
        console.log("CHANGE ACCESS TOKEN AND REFRESH TOKEN ASAP!!!!!!!");
        console.log("HACKER ALERT!!!!!!!");
        throw createError.InternalServerError();
      }
      res.send({
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        phonenumber: user.phonenumber,
        email: user.email,
      });
    } catch (err) {
      next(err);
    }
  },
  GetUsers: async (req, res, next) => {
    try {
      const users = await User.find({});
      res.send({
        users,
      });
    } catch (err) {
      next(err);
    }
  },
  SendVerificationCode: async (req, res, next) => {
    try {
      const result = await verificationSchema.validateAsync(req.body);
      const doesExist = await User.findOne({ email: result.email });
      if (result.new) {
        if (doesExist)
          throw createError.Conflict(result.email + " is already registered");
      } else {
        if (!doesExist) throw createError.BadRequest();
      }
      const code = await mailer.sendEmail(result.email);
      client.SET(
        result.email,
        code,
        "EX",
        process.env.EMAIL_TOKEN_EXP,
        (err, result) => {
          if (err) {
            console.log(err.message);
            reject(createError.InternalServerError());
            return;
          }
        }
      );

      const accessToken = await signAccessTokenCode(result.email);
      res.send({ accessToken });
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  VerifyCode: async (req, res, next) => {
    try {
      const result = await codeSchema.validateAsync(req.body);
      const email = req.payload["aud"];
      var verified;
      client.GET(email, (err, code) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
          return;
        } else {
          var verified = code == result.code;
          if (verified) {
            client.SET(
              email,
              "true",
              "EX",
              process.env.EMAIL_TOKEN_EXP,
              (err, result) => {
                if (err) {
                  console.log(err.message);
                  reject(createError.InternalServerError());
                  return;
                }
              }
            );
          }
          res.send({ verified });
        }
      });
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      const result = await userPasswordSchema.validateAsync(req.body);
      const email = req.payload["aud"];
      const doesExist = await User.findOne({ email: email });
      if (!doesExist) throw createError.BadRequest();
      const isMatch = await user.isValidPassword(result.oldPassword);

      if (!isMatch) throw createError.Unauthorized("Invalid Password");
      if (result.password == result.oldPassword) throw createError.BadRequest();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(result.password, salt);
      result.password = hashedPassword;

      await User.findByIdAndUpdate(userid, { password: result.password });
      res.send();
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
};
