import sqsProducer from '../services/sqsProducer.js';

const messageAttributes = {
    type: 'store_activity_log'
};

const storeActivityLog = async (reqData) => {
    try {
       const result = await sqsProducer.sendMessage('log', reqData, messageAttributes);
      console.log(result);
    //    return response;
    } catch (error) {
        console.error('Error sending activity log to SQS:', error);
        throw error;
    }
}

export {
    storeActivityLog
}