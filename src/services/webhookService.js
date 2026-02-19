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
        const { notification_type = '', login, description = '', date, symbol } = params;

        // Early return if essential params are missing (fast path)
        if (!login || !notification_type) {
            return;
        }

        // Fetch platform account and user details in one go
        const platformAccount = await knex("platform_accounts")
            .join("users", "platform_accounts.user_uuid", "users.uuid")
            .where({ 'platform_accounts.platform_login_id': login })
            .select([
                "platform_accounts.user_uuid",
                "platform_accounts.uuid",
                "users.email",
                "users.first_name"
            ])
            .first();

        if (!platformAccount) return;

        // Store notification directly
        await knex("rms_notifications").insert({
            notification_type,
            user_uuid: platformAccount.user_uuid,
            platform_login_uuid: platformAccount.uuid,
            description,
            created_at: date,
            symbol
        });

        // Fast lookup email whitelist
        const alertEmails = new Set([
            'preston@yeeld.com',
            'Shivamwar97@gmail.com',
            'jeya@sodio.tech',
            'laluxbt@gmail.com',
            'hamza772201@gmail.com',
            'paulosimaphale1@gmail.com'
        ]);

        if (alertEmails.has(platformAccount.email)) {
            const notificationType = notification_type.trim();

            // Use a dictionary to avoid repeated string checks
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

            const activity = activityTypes[notificationType];
            // Only continue if this is a monitored notification type
            if (activity) {
                // Extract trade ID efficiently
                const tradeId = (() => {
                    const match = /^Trade (\d+)/.exec(description);
                    return match ? match[1] : Math.floor(Math.random() * 1000000);
                })();

                const reqParams = {
                    login,
                    breach_name: notificationType,
                    symbol,
                    trade_id: tradeId,
                    description
                };

                // Call breach handler
                const response = await mt5Service.getRmsBreachhandler(reqParams);

                if (response?.success) {
                    const tasks = [];

                    // On hard breach, update account status and notify
                    if (response?.data?.breach_type === 'hard_breach') {
                        tasks.push(
                            knex("platform_accounts")
                                .where("platform_login_id", login)
                                .update({ status: 0 })
                        );
                        tasks.push(
                            sendEmail(
                                platformAccount.email,
                                'SOFT_TO_HARD_BREACH',
                                {
                                    first_name: platformAccount.first_name,
                                    detail: description
                                }
                            )
                        );
                    }

                    tasks.push(
                        storeActivityLog({
                            user_uuid: platformAccount.user_uuid,
                            action: activity.action,
                            metadata: activity.metadata,
                            user_type: 'USER',
                            event_type: 'CHALLENGE',
                            new_values: JSON.stringify(params),
                            created_by: platformAccount.user_uuid
                        })
                    );

                    // Always send user email about the event
                    tasks.push(
                        sendEmail(
                            platformAccount.email,
                            response?.data?.breach_type === 'hard_breach' ? 'STOP_LOSS_VIOLATION' : activity.email_type,
                            {
                                first_name: platformAccount.first_name,
                                detail: description
                            }
                        )
                    );

                    // Execute all async tasks in parallel for faster handling
                    await Promise.all(tasks);
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