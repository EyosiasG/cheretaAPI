const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/admin.controller");
const { verifyAccessTokenAdmin } = require("../helpers/admin_jwt_helper");

//protected route
router.post("/register", AdminController.register);

router.post("/login", AdminController.login);

router.post("/refresh-token", AdminController.refreshToken);

router.delete("/logout", AdminController.logout);

//protected route
router.put(
  "/update-user-info",
  verifyAccessTokenAdmin,
  AdminController.UpdateUserInfo
);

//protected route
//recieve old and new password pair and apply changes
router.put(
  "/update-user-pass",
  verifyAccessTokenAdmin,
  AdminController.UpdateUserPass
);

router.get("/me", verifyAccessTokenAdmin, AdminController.GetUserData);

router.get("/all-admins", verifyAccessTokenAdmin, AdminController.GetAdmins);

module.exports = router;
