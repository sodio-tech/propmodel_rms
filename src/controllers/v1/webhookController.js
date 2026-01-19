/**********************************************************************************************
* Description: Webhook Controller - Handles webhook notification processing.
* Author: Sandeep Chavda
* Last Updated: 2024-06-14
**********************************************************************************************/

import webhookService from "../../services/webhookService.js";
import controllerWrapper from "../../middleware/controllerHandler.js";

/**
 * Handles incoming webhook notifications.
 * 
 * This controller processes webhook notifications sent by external services. It reads the
 * webhook payload from the request body, forwards the data to the webhook service layer for
 * processing, and responds with success or error messages based on the outcome.
 *
 * @param {Object} req - Express request object (expects webhook payload in body)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Success response if notification processed, or error response if failed
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
