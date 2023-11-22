const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.conroller");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const { verifyAccessTokenAdmin } = require("../helpers/admin_jwt_helper");
const { verifyAccessTokenCode } = require("../helpers/code_jwt_helpter");

//protected route
router.post("/register", verifyAccessTokenCode, UserController.register);

router.post("/login", UserController.login);

router.post("/refresh-token", UserController.refreshToken);

router.delete("/logout", UserController.logout);

router.put(
  "/disable-user-acc",
  verifyAccessTokenAdmin,
  UserController.DisableUserAcc
);

router.put(
  "/enable-user-acc",
  verifyAccessTokenAdmin,
  UserController.EnableUserAcc
);
//protected route
router.put(
  "/update-user-info",
  verifyAccessToken,
  UserController.UpdateUserInfo
);

//protected route
//recieve old and new password pair and apply changes
router.put(
  "/update-user-pass",
  verifyAccessToken,
  UserController.UpdateUserPass
);

router.get("/me", verifyAccessToken, UserController.GetUserData);

router.get("/all-users", verifyAccessTokenAdmin, UserController.GetUsers);

router.post("/send-verification-code", UserController.SendVerificationCode);

router.post("/verify-code", verifyAccessTokenCode, UserController.VerifyCode);

router.put(
  "/forgot-pass",
  verifyAccessTokenCode,
  UserController.forgotPassword
);

module.exports = router;
