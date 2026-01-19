/**
 * Service module for managing frontend wallet payout operations.
 * ---------------------------------------------------------------
 * Provides methods for fetching and updating wallet payment requests and settings.
 *
 * @module frontWalletService
 * @author Sandeep Chavda
 * @since 12/12/2025
 */

import dotenv from "dotenv";
import { knex } from "propmodel_api_core"; 
import { storeActivityLog} from "../utils/common_function.js";
//  Load environment variables from a .env file into process.env
dotenv.config();

async function webhookNotificationService(params = {}) {
    try {
        const { notification_type, login, description, date,symbol } = params;
        // Check if login exists in platform_accounts
        const platformAccount = await knex("platform_accounts")
            .where({ 'platform_login_id' : login })
            .first();

        if (!platformAccount) { 
            // If login not found, optionally handle the case (return null or throw, etc.)
            return { success: false, message: "Account not found for the given login." };
        }

        // Insert notification data into rms_notifications table
        const insertData = {
            notification_type: notification_type,
            user_uuid : platformAccount?.user_uuid,
            platform_login_uuid: platformAccount?.uuid,
            description: description,
            created_at: date,
            symbol:symbol
        };

        await knex("rms_notifications").insert(insertData);

        return { success: true, message: "Notification stored successfully." };
        
    } catch (error) {
        console.error(`Failed to remove wallet balance: ${error.message}`);
        return null;
    }
}

export default {    
    webhookNotificationService
}