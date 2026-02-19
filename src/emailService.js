import axios from 'axios';
import { captureException,captureMessage } from "propmodel_sentry_core";

/**
 * Sends an email by calling the specified API endpoint using apiUtils.
 * @param {string} url - The API endpoint URL (relative to baseURL if set in apiUtils).
 * @param {Object} params - The request body parameters (for POST/PUT/PATCH).
 * @param {string} [method='POST'] - HTTP method (GET, POST, PUT, DELETE, etc.).
 * @param {Object} [headers={}] - Additional headers.
 * @returns {Promise<Object>} - The formatted response data.
 */
async function sendEmail(url, params = {}, method = 'POST', headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      // Only include data for methods that support a body
      ...(method !== 'GET' && method !== 'HEAD' ? { data: params } : {})
    };
    const response = await axios(config);
     captureMessage(`Email Response:`, 'info', {
          operation: 'response', 
          extra: {
              response: response,
          }
      });  
    // console.log('response', response);
    return response;
  } catch (error) {
    captureException(error);
    throw error;
  }
}

export default sendEmail;