import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 client with credentials
const s3Client = new S3Client({
    region: process.env.S3_AWS_REGION,
    credentials: {
        accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Upload a file to S3 bucket
 * @param {Buffer|Stream} fileContent - The file content to upload
 * @param {string} fileName - Name of the file in S3
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<Object>} Upload result with file URL
 */
const uploadFile = async (fileContent, fileName, contentType) => {
    try {
        const params = {
            Bucket: process.env.S3_AWS_S3_BUCKET,
            Key: fileName,
            Body: fileContent,
            ContentType: contentType
           //private to public-read
        };

        const command = new PutObjectCommand(params);
        const uploadResult = await s3Client.send(command);
        
        // Construct the URL using the bucket and key
        const fileUrl = `https://${process.env.S3_AWS_S3_BUCKET}.s3.${process.env.S3_AWS_REGION}.amazonaws.com/${fileName}`;
        
        return {
            success: true,
            url: fileUrl,
            key: fileName,
            eTag: uploadResult.ETag
        };
    } catch (error) {
        console.error('S3 upload failed:', error);
        throw new Error(`File upload failed: ${error.message}`);
    }
};

/**
 * Delete a file from S3 bucket
 * @param {string} fileKey - Key of the file to delete
 * @returns {Promise<Object>} Deletion result
 */
const deleteFile = async (fileKey) => {
    try {
        const params = {
            Bucket: process.env.S3_AWS_S3_BUCKET, // Using the same bucket name variable
            Key: fileKey
        };

        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
        
        return {
            success: true,
            message: 'File deleted successfully'
        };
    } catch (error) {
        console.error('S3 deletion failed:', error);
        throw new Error(`File deletion failed: ${error.message}`);
    }
};

/**
 * Generate a signed URL for accessing private S3 objects
 * @param {string} fileKey - Key of the file to generate URL for
 * @param {number} expiryTime - URL expiry time in seconds (default 3600 seconds / 1 hour)
 * @returns {Promise<string>} Signed URL for temporary access
 */
const getSignedUrlData = async (fileKey,expiryTime = 3600) => {
    try {
        const params = {
            Bucket: process.env.S3_AWS_S3_BUCKET,
            Key: fileKey
        };

        const command = new GetObjectCommand(params);
        // const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: expiryTime}); // Set to 1 year (365 days)
        const signedUrl = await getSignedUrl(s3Client, command); // Set to 1 year (365 days)
        return signedUrl;
    } catch (error) {
        console.error('Failed to generate signed URL:', error);
        throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
};

export default {
    uploadFile,
    deleteFile,
    getSignedUrlData
};