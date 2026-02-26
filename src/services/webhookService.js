/**
 * Service module for processing webhook notifications.
 * ---------------------------------------------------
 * Provides methods for handling incoming webhook events,
 * storing notification data, and integrating with the database.
 *
 * @module webhookService
 * @author Sandeep Chavda
 * @since 14/06/2024
 */

import dotenv from "dotenv";
import { knex } from "propmodel_api_core"; 
import { storeActivityLog} from "../utils/common_function.js";
import mt5Service from "./mt5Service.js";
import emailService from "../emailService.js";
import { captureException, captureMessage } from "propmodel_sentry_core";
//  Load environment variables from a .env file into process.env
dotenv.config();

async function webhookNotificationService(params = {}) {
    try {
        const { notification_type, login, description, date, symbol } = params;

        // Check if login exists in platform_accounts
        const platformAccount = await knex("platform_accounts")
            .join("users", "platform_accounts.user_uuid", "users.uuid")
            .where({ 'platform_accounts.platform_login_id': login })
            .select("platform_accounts.user_uuid", "platform_accounts.uuid", "users.email", "users.first_name")
            .first();

        if (!platformAccount) return;

        // Insert notification data into rms_notifications table
        await knex("rms_notifications").insert({
            notification_type,
            user_uuid: platformAccount.user_uuid,
            platform_login_uuid: platformAccount.uuid,
            description,
            created_at: date,
            symbol
        });

        // List of privileged emails to check against
        const privilegedEmails = new Set([
            'preston@yeeld.com',
            'Shivamwar97@gmail.com',
            'jeya@sodio.tech',
            'laluxbt@gmail.com',
            'hamza772201@gmail.com',
            'paulosimaphale1@gmail.com',
            'yussifkbalchisu@gmail.com',
            'thearunsky@gmail.com'
        ]);

        const notificationType = notification_type?.trim();
        const validNotificationTypes = new Set([
            'Max Risk Per Trade',
            'Soft Breach Symbol Alert',
            'Soft Breach Trade Alert'
        ]);
        
        const isPrivilegedUser = privilegedEmails.has(platformAccount.email);
        const isValidNotification = validNotificationTypes.has(notificationType);

        // if (isPrivilegedUser && isValidNotification) {
        if (isValidNotification) {
            // Breach type is same as notificationType here, can further optimize if mappings needed
            const breachType = notificationType;

            // Extract trade id or generate a random one
            const tradeIdMatch = description.match(/^Trade (\d+)/);
            const tradeId = tradeIdMatch ? tradeIdMatch[1] : Math.floor(Math.random() * 1000000);

            const reqParams = {
                login,
                breach_name: breachType,
                symbol,
                trade_id: tradeId,
                description
            };

            const response = await mt5Service.getRmsBreachhandler(reqParams);

            if (response?.success) {
                const activityTypes = {
                    'Max Risk Per Trade': {
                        action: 'Max_Risk_Per_Trade',
                        metadata: `Your account No - ${login} is breached max risk per trade.`,
                        email_type: 'STOP_LOSS_VIOLATION'
                    },
                    'Soft Breach Symbol Alert': {
                        action: 'Soft_Breach_Symbol_Alert',
                        metadata: `Your account No - ${login} is breached soft breach symbol alert.`,
                        email_type: 'SOFTBREACH_2_PERCENT'
                    },
                    'Soft Breach Trade Alert': {
                        action: 'Soft_Breach_Trade_Alert',
                        metadata: `Your account No - ${login} is breached soft breach trade alert.`,
                        email_type: 'SOFTBREACH_2_PERCENT'
                    }
                };
                const userEmail = platformAccount.email;

                const activity = activityTypes[notificationType];
                if (activity) {
                    await storeActivityLog({
                        user_uuid: platformAccount.user_uuid,
                        action: activity.action,
                        metadata: activity.metadata,
                        user_type: 'USER',
                        event_type: 'CHALLENGE',
                        new_values: JSON.stringify(params),
                        created_by: platformAccount.user_uuid
                    });

                    // Send email to user
                    const emailData = {
                        first_name: platformAccount.first_name,
                        detail: description
                    };
                    await sendEmail(userEmail, activity.email_type, emailData);
                }

                if (response?.data?.breach_type === 'hard_breach') {
                    await knex("platform_accounts")
                        .where("platform_login_id", login)
                        .update({ status: 0 });

                    const emailType = 'SOFT_TO_HARD_BREACH';
                    const eData = {
                        first_name: platformAccount.first_name,
                        detail: description
                    };
                    await sendEmail(userEmail, emailType, eData);

                    await storeActivityLog({
                        user_uuid: platformAccount.user_uuid,
                        action: 'CHALLENGE_FAILED',
                        metadata: `Your account is failed to complete the challenge - ${login}`,
                        user_type: 'USER',
                        event_type: 'CHALLENGE',
                        new_values: JSON.stringify(params),
                        created_by: platformAccount.user_uuid
                    });
                }
            }
        }

        return { success: true, message: "Notification stored successfully." };
    } catch (error) {
        captureException(error);
        console.error(`Failed to webhook: ${error.message}`);
        return null;
    }
}

async function sendEmail(email, emailType, data) {
    const emailUrl = `${process.env.EMAIL_API_URL}/api/v1/send-email`;
    const emailData = {
        email,
        email_type: emailType,
        data
    };
    try {
        await emailService(emailUrl, emailData, 'POST');
    } catch (error) {
        captureException(error);
        throw error;
    }
}

export default {    
    webhookNotificationService
}