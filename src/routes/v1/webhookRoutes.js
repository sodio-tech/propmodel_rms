/**
 * Frontend Wallet Payout Routes
 * --------------------------------------
 * Handles routing for Wallet Payout API endpoints,
 * including retrieval of user wallet payout history.
 * 
 * Author: Sandeep Chavda
 * Last Updated: 14/06/2024
 */

import express from "express";
import webhookController from "../../controllers/v1/webhookController.js";
import verifyToken from "../../middleware/verifyToken.js";

const router = express.Router();

router.post(
    '/webhook/notification',
    verifyToken,
    webhookController.getWebhookNotification
);

  
export default router;