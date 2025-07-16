import S3Operations from "@/models/s3Operations";


export async function POST(request: Request) {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bucketName = formData.get('bucketName') as string;
        const contentType = file.type;

        if (!file || !bucketName) {
            return new Response(JSON.stringify({ error: 'Missing file or bucketName' }), { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const s3 = new S3Operations(bucketName);
        const fileUrl = await s3.uploadBytesToS3(buffer, '', contentType);
        return new Response(JSON.stringify({ "message": "File uploaded successfully", fileUrl }), { status: 201 });

}