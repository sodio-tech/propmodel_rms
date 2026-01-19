// import updateWalletSettingScheme from "../requests/updateWalletSettingRequest.js";

/**
 * Generic request validation handler
 * @param {Object} schema - Joi schema to validate against
 * @param {string} property - Request property to validate (body, query, params)
 */
const requestHandler = (schema, property = "body",context = null) => {
    return async (req, res, next) => {
      try {
        req[property] = await schema.validateAsync(req[property], {
          abortEarly: false,
          stripUnknown: true,
          context: context
        });
        next();
      } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
         }); 
      }
    };
};

export  { 
    requestHandler
    // updateWalletSettingScheme
};