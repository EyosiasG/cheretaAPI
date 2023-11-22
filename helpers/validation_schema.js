const Joi = require("joi");

const userauthSchema = Joi.object({
  password: Joi.string().min(8).required(),
  first_name: Joi.string().required(),
  middle_name: Joi.string().required(),
  last_name: Joi.string().required(),
  phonenumber: Joi.string().required(),
});

const adminauthSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().required(),
  middle_name: Joi.string().required(),
  last_name: Joi.string().required(),
  phonenumber: Joi.string().required(),
});

const updateOrderSchemma = Joi.object({
  id: Joi.string().required(),
  status: Joi.string().required(),
});

const updateFeatureSchemma = Joi.object({
  id: Joi.string().required(),
});

const userSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  first_name: Joi.string().required(),
  middle_name: Joi.string().required(),
  last_name: Joi.string().required(),
  phonenumber: Joi.string().required(),
});

const disableSchema = Joi.object({
  email: Joi.string().required(),
});

const userPasswordSchema = Joi.object({
  oldPassword: Joi.string().min(8).required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
});

const tierSchema = Joi.object({
  description: Joi.string().allow(null, ""),
  price: Joi.number().required(),
  bundle: Joi.array().items(Joi.string()).min(1).required(),
});

const packageSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(null, ""),
  tiers: Joi.array().items(tierSchema).min(1).required(),
  provider: Joi.string().required(),
});

const updateSettingSchemma = Joi.object({
  id: Joi.string().required(),
  setting: Joi.string().required(),
});

const charitySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  bankAccount: Joi.string().required(),
  bankAccountName: Joi.string().required(),
  bankName: Joi.string().required(),
});

const cashSchema = Joi.object({
  name: Joi.string().required(),
});

const settingsSchema = Joi.object({
  name: Joi.string().required(),
  setting: Joi.number().required(),
});

const packageOrderSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  package: Joi.string().required(),
  provider: Joi.string().required(),
  amount: Joi.string().required(),
  address: Joi.string().required(),
});

const giftOrderSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  amount: Joi.string().required(),
});

const donationOrderSchema = Joi.object({
  name: Joi.string().required(),
  amount: Joi.string().required(),
});

const cashOrderSchema = Joi.object({
  bank: Joi.string().required(),
  name: Joi.string().required(),
  account: Joi.string().required(),
  amount: Joi.string().required(),
  reason: Joi.string().required(),
});

const cashPickupOrderSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  amount: Joi.string().required(),
  reason: Joi.string().required(),
});

const verificationSchema = Joi.object({
  email: Joi.string().required(),
  new: Joi.boolean().required(),
});

const codeSchema = Joi.object({
  code: Joi.string().required(),
});

module.exports = {
  verificationSchema,
  codeSchema,
  userauthSchema,
  adminauthSchema,
  loginSchema,
  userSchema,
  userPasswordSchema,
  packageSchema,
  charitySchema,
  cashSchema,
  settingsSchema,
  packageOrderSchema,
  giftOrderSchema,
  cashOrderSchema,
  donationOrderSchema,
  disableSchema,
  updateOrderSchemma,
  updateFeatureSchemma,
  updateSettingSchemma,
  cashPickupOrderSchema,
};
