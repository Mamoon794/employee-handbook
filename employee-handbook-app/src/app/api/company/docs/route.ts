import {Company} from "@/models/schema";
import {getCompany, updateCompany} from "@/models/dbOperations";
import { Sentry } from "@/lib/sentry";


export async function PUT(request: Request) {
    try {
        const { companyId, documents }: { companyId: string; documents: Company['documents'] } = await request.json();
        const getCompanyResponse = await getCompany(companyId);
        if (!getCompanyResponse) {
            return new Response(JSON.stringify({ error: 'Company not found' }), { status: 404 });
        }
        if (!getCompanyResponse.documents){
            getCompanyResponse.documents = [];
        }
        getCompanyResponse.documents.push(...documents);
        await updateCompany(companyId, { documents: getCompanyResponse.documents });

    } catch (error) {
        console.error("Error updating company documents:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ error: 'Failed to update company documents' }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Company documents updated successfully' }), { status: 200 });
}

export async function DELETE(request: Request) {
    try {
        const { companyId, index }: { companyId: string; index: number } = await request.json();
        const getCompanyResponse = await getCompany(companyId);
        if (!getCompanyResponse || !getCompanyResponse.documents || index < 0 || index >= getCompanyResponse.documents.length) {
            return new Response(JSON.stringify({ error: 'Invalid company ID or document index' }), { status: 404 });
        }
        getCompanyResponse.documents.splice(index, 1);
        await updateCompany(companyId, { documents: getCompanyResponse.documents });
    } catch (error) {
        console.error("Error deleting company document:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ error: 'Failed to delete company document' }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Company document deleted successfully' }), { status: 200 });
}