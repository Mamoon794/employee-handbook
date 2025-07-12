import {Company} from "@/models/schema";
import {getCompany} from "@/models/dbOperations";
import { Sentry } from "@/lib/sentry";

export async function GET(request: Request) {
    try {
        const { companyId }: { companyId: string } = await request.json();
        if (!companyId) {
            return new Response(JSON.stringify({ error: 'Missing companyId' }), { status: 400 });
        }
        const company = await getCompany(companyId);
        
        
        
        return new Response(JSON.stringify({ message: 'Company Documents fetched successfully', companyDocs: company?.documents }), { status: 200 });
    } catch (error) {
        console.error("Error fetching company:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ error: 'Failed to fetch company' }), { status: 500 });
    }
}