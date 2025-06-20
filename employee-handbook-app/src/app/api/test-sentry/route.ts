import { Sentry } from "../../../lib/sentry";

export async function GET() {
    try {
        // This will throw a ReferenceError because the function doesn't exist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const undefinedFunction = (global as any).nonExistentFunction;
        undefinedFunction();
        
        return new Response(JSON.stringify({ message: "This shouldn't be reached" }), { status: 200 });
    } catch (error) {
        console.error("Test error for Sentry:", error);
        Sentry.captureException(error);
        return new Response(JSON.stringify({ 
            error: "Test error triggered successfully" 
        }), { status: 500 });
    }
} 