/**
 * Webhook Notification Routes
 * --------------------------------------
 * Handles routing for webhook notification API endpoints,
 * including processing of incoming webhook notifications.
 * 
 * Author: Sandeep Chavda
 * Last Updated: 14/06/2024
 */

import express from "express";
import webhookController from "../../controllers/v1/webhookController.js";
import verifyToken from "../../middleware/verifyToken.js";

const router = express.Router();

/**
 * POST /webhook/notification
 * --------------------------
 * Route to receive and process webhook notifications from external sources.
 * This endpoint requires a valid authentication token (verifyToken middleware).
 * The webhook payload is expected in the request body.
 * On success: returns status 200 with a confirmation message.
 * On failure: returns status 404 or an error message.
 */
router.post(
    '/webhook/notification',
    verifyToken,
    webhookController.getWebhookNotification
);

  
export default router;