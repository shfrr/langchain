import { useState } from 'react';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    alert(data.message);
    setLoading(false);
  };

  const handleAsk = async () => {
    setLoading(true);
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>📄 Upload PDF & Chat dengan Gemini Flash</h1>

      <div style={{ marginTop: 30 }}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={loading} style={{ marginLeft: 10 }}>
          {loading ? 'Uploading...' : 'Upload & Embed'}
        </button>
      </div>

      <div style={{ marginTop: 40 }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Tanyakan sesuatu..."
          style={{ width: 300, padding: 5 }}
        />
        <button onClick={handleAsk} disabled={loading} style={{ marginLeft: 10 }}>
          {loading ? 'Memproses...' : 'Tanya'}
        </button>
      </div>

      {answer && (
        <div style={{ marginTop: 20, background: '#f0f0f0', padding: 20 }}>
          <strong>Jawaban:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
