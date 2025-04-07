import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import * as dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  const { question } = req.body;

  const pinecone = new Pinecone();
  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });

  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: "embedding-001",
  });

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
  });

  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: "gemini-1.5-flash",
    temperature: 0.3,
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

  const result = await chain.call({
    question: question,
    chat_history: [],
  });

  res.status(200).json({ answer: result.text });
}
