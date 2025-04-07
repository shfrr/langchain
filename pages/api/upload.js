import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from '@langchain/community/vectorstores/pinecone';
import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  api: {
    bodyParser: false,
  },
};

// Promise wrapper untuk formidable
const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      uploadDir: './uploads',
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

const upload = async (req, res) => {
  try {
    const { fields, files } = await parseForm(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = uploadedFile.filepath;

    // [1/6] Baca file PDF
    console.log('🚀 [1/6] Membaca dan parsing file PDF...');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data.text;
    console.log(`✅ [1/6] PDF berhasil dibaca (${text.length} karakter)`);

    // [2/6] Split dokumen
    console.log('✂️ [2/6] Memecah dokumen...');
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([text]);
    console.log(`✅ [2/6] Dokumen terpecah menjadi ${docs.length} chunks`);

    // [3/6] Embedding
    console.log('🧠 [3/6] Membuat embeddings...');
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: 'embedding-001',
    });
    console.log('✅ [3/6] Embeddings siap digunakan');

    // [4/6] Init Pinecone
    console.log('🌲 [4/6] Inisialisasi Pinecone...');
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        projectId: process.env.PINECONE_PROJECT_ID,
        environment: process.env.PINECONE_ENV,
      });
      
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    console.log('✅ [4/6] Pinecone siap');

    // [5/6] Simpan ke Pinecone
    console.log('📦 [5/6] Menyimpan data ke Pinecone...');
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
    });
    console.log('✅ [5/6] Dokumen berhasil disimpan di Pinecone');

    // [6/6] Done
    res.status(200).json({ message: '✅ Berhasil di-embed dan simpan ke Pinecone!' });
    console.log('🎉 [6/6] Proses selesai!\n');
  } catch (error) {
    console.error('❌ Terjadi error saat proses:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
};

export default upload;
