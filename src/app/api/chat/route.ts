    import { streamText, convertToModelMessages, type UIMessage } from "ai";
    import { google } from "@ai-sdk/google";
    import { CAREERSYNC_SYSTEM_PROMPT } from "@/app/lib/prompt";

    export async function POST(req: Request) {
    try {
        const { messages }: { messages: UIMessage[] } = await req.json();

        const result = await streamText({
        model: google("gemini-3.8-flash"),
        messages: await convertToModelMessages(messages),   
        system: CAREERSYNC_SYSTEM_PROMPT,
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("AI Stream Crash:", error);
        return new Response(
        JSON.stringify({
            error: "Something went wrong. Please try again.",
        }),
        {
            status: 500,
            headers: { "Content-Type": "application/json" },
        },
        );
    }
    }