// Desc: Middleware to validate user input for wallet Settings
// Auth: Sandeep Chavda 
// Date: 12/12/2025

import Joi from "joi";

const updateWalletSettingScheme = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'string.base': 'Status should be a type of text',
      'any.only': 'Status must be either "active" or "inactive"',
      'any.required': 'Status is required'
    }),
  outgoing_transaction: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'string.base': 'Outgoing Transaction status should be a type of text',
      'any.only': 'Outgoing Transaction must be either "active" or "inactive"',
      'any.required': 'Outgoing Transaction is required'
    }),
  wallet_usage_challenge: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'string.base': 'Wallet Usage Challenge should be a type of text',
      'any.only': 'Wallet Usage Challenge must be either "active" or "inactive"',
      'any.required': 'Wallet Usage Challenge is required'
    }),
  wallet_usage_competition: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'string.base': 'Wallet Usage Competition should be a type of text',
      'any.only': 'Wallet Usage Competition must be either "active" or "inactive"',
      'any.required': 'Wallet Usage Competition is required'
    }),
  wallet_usage_courses: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'string.base': 'Wallet Usage Courses should be a type of text',
      'any.only': 'Wallet Usage Courses must be either "active" or "inactive"',
      'any.required': 'Wallet Usage Courses is required'
    }),
  challenge_profit_bonus: Joi.number()
    .precision(2)
    .min(0)
    .messages({
      'number.base': 'Challenge Profit Bonus must be a decimal number',
      'number.min': 'Challenge Profit Bonus cannot be negative'
    }),
  custom_message_challenge: Joi.string()
    .messages({
      'string.base': 'Custom Message Challenge should be a type of text'
    }),
  affiliate_profit_bonus: Joi.number()
    .precision(2)
    .min(0)
    .messages({
      'number.base': 'Affiliate Profit Bonus must be a decimal number',
      'number.min': 'Affiliate Profit Bonus cannot be negative'
    }),
  custom_message_affiliate: Joi.string()
    .messages({
      'string.base': 'Custom Message Affiliate should be a type of text'
    }),
});

export default updateWalletSettingScheme; 
