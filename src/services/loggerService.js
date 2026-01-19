import axios from 'axios';
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();
/**
 * Base URL for the API endpoints
 * @constant {string}
 */
const BASE_URL = process.env.LOG_API_BASE_URL;

/**
 * Authentication token for API requests
 * @constant {string}
 */
const AUTH_TOKEN = process.env.API_KEY;


/**
 * Axios instance for making HTTP requests
 * Configured with base URL and default headers
 * @constant {AxiosInstance}
 */

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'apiKey': AUTH_TOKEN,
        'Content-Type': 'application/json'
    }
});
/**
 * Handles successful API responses
 * @param {Object} response - The API response object
 * @returns {Object} Formatted response with success status and data/error
 */


const handleApiResponse = (response) => {
    const { status_code, content, message } = response.data;
    return status_code === 200
        ? { success: true, data: content }
        : { success: false, error: content || message, statusCode: status_code || 500 };
};

/**
 * Handles API errors
 * @param {Error} error - The error object from failed API request
 * @returns {Object} Formatted error response with failure status and error details
 */
const handleApiError = (error) => ({
    success: false,
    error: error.message,
    statusCode: error?.response?.status || 500
});

const storeUserActivityLog = async (logData) => {
    try {
        const response = await apiClient.post('/v1/store-user-activities', logData);
        return handleApiResponse(response); 
    }   
    catch (error) {
        return handleApiError(error);  
    }
}

export {
    storeUserActivityLog
};