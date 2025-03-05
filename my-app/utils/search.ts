import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string) {
    const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small", // cheapest model
        input: text,
    });
    return embeddingResponse.data[0].embedding;
}
