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
        
        const { notification_type, login, description, date,symbol } = params;
        
        // Check if login exists in platform_accounts
        const platformAccount = await knex("platform_accounts")
            .join("users", "platform_accounts.user_uuid", "users.uuid")
            .where({ 'platform_accounts.platform_login_id': login })
            .select("platform_accounts.user_uuid","platform_accounts.uuid","users.email","users.first_name")
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
       
        if(platformAccount.email == 'preston@yeeld.com' || platformAccount.email == 'Shivamwar97@gmail.com' || platformAccount.email == 'jeya@sodio.tech' || platformAccount.email == 'laluxbt@gmail.com' || platformAccount.email == 'hamza772201@gmail.com' || platformAccount.email == 'paulosimaphale1@gmail.com')
        {
            const notificationType = notification_type.trim();
            if (
                notificationType == 'Max Risk Per Trade' || notificationType == 'Soft Breach Symbol Alert' || notificationType == 'Soft Breach Trade Alert'
            )
            {
                let breachType = notificationType;

                // if(notificationType == 'Stop-Loss Risk - Max Risk Per Trade')
                // {
                //     breachType = 'Max Risk Per Trade';
                // }
                // else if(notificationType == 'Stop-Loss Risk - Soft Breach Symbol Alert')
                // {
                //     breachType = 'Soft Breach Symbol Alert';
                // }
                // else if(notificationType == 'Stop-Loss Risk - Soft Breach Trade Alert')
                // {
                //     breachType = 'Soft Breach Trade Alert';
                // }


                
                const tradeIdMatch = description.match(/^Trade (\d+)/);
                const tradeId = tradeIdMatch ? tradeIdMatch[1] : null;
                const reqParams = { 
                    "login": login,
                    "breach_name": breachType,
                    "symbol": symbol,
                    "trade_id": tradeId ? tradeId : Math.floor(Math.random() * 1000000),
                    "description": description
                }
               
                const response = await mt5Service.getRmsBreachhandler(reqParams);
                
                if(response?.success)
                {
                    // Store activity record (optimized)
                    const activityTypes = {
                        'Max Risk Per Trade': {
                            action: 'Max_Risk_Per_Trade',
                            metadata: `Your account No - ${login} is breached max risk per trade.`,
                            email_type : 'STOP_LOSS_VIOLATION'
                        },
                        'Soft Breach Symbol Alert': {
                            action: 'Soft_Breach_Symbol_Alert',
                            metadata: `Your account No - ${login} is breached soft breach symbol alert.`,
                            email_type : 'SOFTBREACH_2_PERCENT'
                        },
                        'Soft Breach Trade Alert': {
                            action: 'Soft_Breach_Trade_Alert',
                            metadata: `Your account No - ${login} is breached soft breach trade alert.`,
                            email_type : 'SOFTBREACH_2_PERCENT'
                        }
                    };
                     
                    // Check for hard breach and add "Hard Breach" activity type if not present
                    let userEmail = platformAccount?.email;
                    if (response?.data.breach_type == 'hard_breach') {

                        await knex("platform_accounts")
                        .where("platform_login_id", login)
                        .update({ status: 0 });

                        let emailType = 'SOFT_TO_HARD_BREACH'; 
                        let eData = {
                            first_name: platformAccount?.first_name,
                            detail: description
                        }
                        await sendEmail(userEmail, emailType, eData);

                        await storeActivityLog({ 
                            user_uuid: platformAccount?.user_uuid, 
                            action: 'CHALLENGE_FAILED', 
                            metadata: `Your account is failed to complete the challenge - ${login}`, 
                            user_type: 'USER',
                            event_type: 'CHALLENGE',
                            new_values: JSON.stringify(params),
                            created_by: platformAccount?.user_uuid 
                        });

                    }
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

                    // Send email to user
                    let emailType = activity?.email_type; 
                    const emailData = {
                        first_name: platformAccount?.first_name,
                        detail: description
                    }
                    await sendEmail(userEmail, emailType, emailData);
                    // let emailUrl = `${process.env.EMAIL_API_URL}/api/v1/send-email`;
                    // const emailData = {
                    //     email: platformAccount?.email,
                    //     email_type: response?.data.breach_type == 'hard_breach' ? 'STOP_LOSS_VIOLATION' : activity?.email_type,
                    //     data: {
                    //         first_name: platformAccount?.first_name,
                    //         detail: description
                    //     }
                    // }; 
                    // captureMessage(`Email data:`, 'info', {
                    //     operation: 'response', 
                    //     extra: {
                    //         response: emailData,
                    //     }
                    // });  
                    // try {
                    //     await emailService(emailUrl, emailData, 'POST');
                    // } catch (error) {
                    //     captureException(error);
                    // } 
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