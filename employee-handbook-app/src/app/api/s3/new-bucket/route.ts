import S3Operations from "@/models/s3Operations";

export async function POST(request: Request) {
    try {
        const { bucketName } = await request.json();
        let s3 = new S3Operations(bucketName);
        await s3.createBucket();
        return new Response(JSON.stringify({ "message": "Bucket created successfully" }), { status: 201 });
    } catch (error) {
        console.error("Error creating bucket:", error);
        return new Response(JSON.stringify({ "error": "Failed to create bucket" }), { status: 500 });
    }
}