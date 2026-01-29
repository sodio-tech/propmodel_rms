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
import { captureException, captureMessage } from "propmodel_sentry_core";
//  Load environment variables from a .env file into process.env
dotenv.config();

async function webhookNotificationService(params = {}) {
    try {
        const { notification_type, login, description, date,symbol } = params;
        console.log(params);
        // Check if login exists in platform_accounts
        const platformAccount = await knex("platform_accounts")
            .join("users", "platform_accounts.user_uuid", "users.uuid")
            .where({ 'platform_accounts.platform_login_id': login })
            .select("platform_accounts.user_uuid","platform_accounts.uuid","users.email")
            .first();

        if (!platformAccount) { 
            return;
            // return { success: false, message: "Account not found for the given login." };
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
       
        if(platformAccount.email == 'Shivamwar97@gmail.com' || platformAccount.email == 'jeya@sodio.tech')
        {
            const notificationType = notification_type.trim();
            if (
                notificationType == 'Max Risk Per Trade' || notificationType == 'Soft Breach Symbol Alert' || notificationType == 'Soft Breach Trade Alert'
            )
            {
                const tradeId = description.replace(/^Trade (\d+).*$/, '$1');
                const reqParams = { 
                    "login": login,
                    "breach_name": notification_type.trim(),
                    "symbol": symbol,
                    "trade_id": tradeId,
                    "description": description
                }
               
                // captureMessage(`Request params: ${platformAccount.uuid}`, 'info', {
                //     operation: 'Max Risk Per Trade',
                //     extra: {
                //         platform_account_uuid: platformAccount.uuid,
                //         user_uuid: platformAccount.user_uuid,
                //         login: platformAccount.platform_login_id || login,
                //         email: platformAccount.email,
                //         symbol:symbol,
                //         tradeId:tradeId
                //     }
                // });  

                const response = await mt5Service.getRmsBreachhandler(reqParams);
                if(response?.data.breach_type == 'hard_breach')
                {
                    await knex("platform_accounts")
                        .where("platform_login_id", login)
                        .update({ status: 0 });
                }
                // Store activity record (optimized)
                const activityTypes = {
                    'Max Risk Per Trade': {
                        action: 'Max_Risk_Per_Trade',
                        metadata: `Your account No - ${login} is breached max risk per trade.`
                    },
                    'Soft Breach Symbol Alert': {
                        action: 'Soft_Breach_Symbol_Alert',
                        metadata: `Your account No - ${login} is breached soft breach symbol alert.`
                    },
                    'Soft Breach Trade Alert': {
                        action: 'Soft_Breach_Trade_Alert',
                        metadata: `Your account No - ${login} is breached soft breach trade alert.`
                    }
                };

                const activity = activityTypes[notificationType];
                if (activity) {
                    await storeActivityLog({
                        user_uuid: platformAccount?.user_uuid,
                        action: activity?.action,
                        metadata: activity?.metadata,
                        user_type: 'USER',
                        event_type: 'CHALLENGE',
                        new_values: JSON.stringify(params),
                        created_by: platformAccount?.user_uuid
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

export default {    
    webhookNotificationService
}