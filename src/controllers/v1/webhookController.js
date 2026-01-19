/**********************************************************************************************
* Description: Front Wallet Controller - Handles wallet payout retrieval for frontend users.
* Author: Sandeep Chavda
* Last Updated: 2024-06-14
**********************************************************************************************/

import webhookService from "../../services/webhookService.js";
import controllerWrapper from "../../middleware/controllerHandler.js";

/**
 * Retrieves wallet payout history for the authenticated frontend user.
 * 
 * This controller fetches the wallet payout records for the logged-in user by accepting
 * query parameters (for pagination, ordering, etc.) and user token data,
 * invokes the service layer, and returns success or error response accordingly.
 *
 * @param {Object} req - Express request object (expects query params for filtering and pagination)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Success response with payout history data or error response if no records are found
 */
const getWebhookNotification = controllerWrapper(async (req, res, next) => {  
    const params = req.body;
    const result = await webhookService.webhookNotificationService(params);
    if (!result || result.success == false) {
        return res.error(result?.message || "record_not_found", [], 404);
    }
    return res.success(result.message || "record_found", true,200);
});


export default {
    getWebhookNotification
};
