import {Company} from "../../../models/schema";
import {createCompany} from "../../../models/dbOperations";
import { Sentry } from "../../../lib/sentry";

export async function POST(request: Request){
    try{
        const {companyData}: {companyData: Omit<Company, "id">} = await request.json();
        const companyDoc = await createCompany(companyData);
        return new Response(JSON.stringify({"message": "Company created successfully", id: companyDoc.id }), { status: 201 });
    } catch (error) {
        console.error("Error creating company:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ "error": "Failed to create company" }), { status: 500 });
    }

}