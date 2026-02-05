/************************************************************
 * MT5 Service Module
 * This module handles MT5 trading platform related operations
 * including account creation and management
 ************************************************************/
import { apiClient, handleApiResponse, handleApiError } from '../utils/apiUtils.js';
import { captureException } from "propmodel_sentry_core";

 /**
 * Retrieves MT5 trading overview information based on the provided parameters
 * @param {Object} reqParams - The request parameters object
 * @returns {Promise<Object>} The trade overview data response from the API
 * @throws {Error} If the API request fails
 */
const getRmsBreachhandler = async (reqParams = {}) => {
    try {
        // Make the API request
        const response = await apiClient.post('/account/rms_breach_handler', reqParams);
        return handleApiResponse(response);
    } catch (error) {
        captureException(error,{extra:{reqParams, baseUrl: apiClient.defaults?.baseURL}});
        return handleApiError(error);
    }
}

export default {
    getRmsBreachhandler
};