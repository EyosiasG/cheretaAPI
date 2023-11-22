const createError = require("http-errors");
const bcrypt = require("bcrypt");
const Admin = require("../models/admin.model");
const {
  adminauthSchema,
  loginSchema,
  userSchema,
  userPasswordSchema,
} = require("../helpers/validation_schema");
const {
  signAccessTokenAdmin,
  signRefreshTokenAdmin,
  verifyRefreshTokenAdmin,
} = require("../helpers/admin_jwt_helper");
const client = require("../helpers/init_redis");

module.exports = {
  register: async (req, res, next) => {
    try {
      const result = await adminauthSchema.validateAsync(req.body);
      const doesExist = await Admin.findOne({ email: result.email });
      if (doesExist)
        throw createError.Conflict(result.email + " is already registered");

      const user = new Admin({
        first_name: result.first_name,
        middle_name: result.middle_name,
        last_name: result.last_name,
        phonenumber: result.phonenumber,
        password: result.password,
        email: result.email,
        status: true,
      });

      const savedUser = await user.save();
      const accessToken = await signAccessTokenAdmin(savedUser.id);
      const refreshToken = await signRefreshTokenAdmin(savedUser.id);
      res.send({ accessToken, refreshToken });
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  login: async (req, res, next) => {
    try {
      const result = await loginSchema.validateAsync(req.body);
      const user = await Admin.findOne({ email: result.email });

      if (!user) throw createError.Unauthorized("Invalid Username/Password");

      const isMatch = await user.isValidPassword(result.password);

      if (!isMatch || !user.status)
        throw createError.Unauthorized("Invalid Username/Password");

      const accessToken = await signAccessTokenAdmin(user.id);
      const refreshToken = await signRefreshTokenAdmin(user.id);
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
      const userId = await verifyRefreshTokenAdmin(refreshToken);

      const accessToken = await signAccessTokenAdmin(userId);
      const newRefreshToken = await signRefreshTokenAdmin(userId);
      res.send({ accessToken: accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const userId = await verifyRefreshTokenAdmin(refreshToken);
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
      await Admin.findByIdAndUpdate(userid, result);
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
      const user = await Admin.findById(userid);

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

      await Admin.findByIdAndUpdate(userid, { password: result.password });
      res.send();
    } catch (err) {
      if (err.isJoi === true) err.status = 422;
      next(err);
    }
  },
  GetUserData: async (req, res, next) => {
    try {
      const userid = req.payload["aud"];
      const user = await Admin.findById(userid);

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
  GetAdmins: async (req, res, next) => {
    try {
      const admins = await Admin.find({});
      res.send({
        admins,
      });
    } catch (err) {
      next(err);
    }
  },
};
