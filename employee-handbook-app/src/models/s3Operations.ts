import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs"
import { Readable } from "stream";


class S3Operations {
    private s3Client: S3Client;
    private bucketName: string;
    private region: string;
    
    constructor(bucketName: string) {
        this.region = process.env.AWS_REGION || "";
        this.s3Client = new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
            }
        })
        this.bucketName = bucketName;
    }
    async createBucket(newBucketName?: string) {
        try{
            if (!newBucketName) {
                newBucketName = this.bucketName;
            }
            const command = new CreateBucketCommand({ Bucket: newBucketName});
            const response = await this.s3Client.send(command);
            console.log("Bucket created successfully:", response);
        }
        catch (error) {
            console.error("Error creating bucket:", error);
        }
    }

    async uploadFileToS3(localPath: string, s3Key?: string){
        try {
            if (!s3Key) {
                s3Key = this.createKey();
            }
            const fileStream = fs.createReadStream(localPath);
            const upload = new Upload({
                client: this.s3Client,
                params: {Bucket: this.bucketName, Key: s3Key, Body: fileStream}
            });
            const response = await upload.done();
            console.log("File uploaded successfully:", response);
            return this.createS3Url(s3Key);
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    }

    async uploadBytesToS3(buffer: Buffer, s3Key?: string, contentType?: string) {
        try {
            if (!s3Key) {
                s3Key = this.createKey();
            }
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
                Body: buffer,
                ContentType: contentType || "application/octet-stream"
            });
            const response = await this.s3Client.send(command);
            console.log("File uploaded successfully:", response);
            return this.createS3Url(s3Key);
        } catch (error) {
            console.error("Error creating S3 key:", error);
        }
    }

    async downloadFile(s3Key: string, outputPath: string){
        try {
            const command = new GetObjectCommand({ Bucket: this.bucketName, Key: s3Key });
            const response = await this.s3Client.send(command);
            const writeStream = fs.createWriteStream(outputPath);
            const body = response.Body as Readable;
            body.pipe(writeStream);
            writeStream.on("finish", () => {
                console.log("File downloaded successfully to:", outputPath);
            });
            writeStream.on("error", (error) => {
                console.error("Error writing file:", error);
            });
            
        } catch (error) {
            console.error("Error downloading file:", error);
            throw error;
        }
        
    }

    createKey(){
        const random = Math.random().toString(36).substring(2, 15);
        return new Date().toISOString() + "-" + random;
    }

    async createS3Url(s3Key: string) {
        const command = new GetObjectCommand({ Bucket: this.bucketName, Key: s3Key });
        const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        return url.split("?")[0]; 
    }


}

export default S3Operations;