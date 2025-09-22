'use client';
import { useState, useCallback, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import styles from './page.module.css';

interface FontResult {
  font_name: string; foundry: string; purchase_url: string; similarity: number;
}
interface ApiResponse {
  filename: string; results: FontResult[];
}

const Home: NextPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<FontResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000');
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setResults(null);
      setError(null);
      if (preview) { URL.revokeObjectURL(preview); }
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, [preview]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, multiple: false,
  });

  const handleIdentify = async () => {
    if (!file || !apiUrl) return;
    setIsLoading(true); setError(null); setResults(null);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await axios.post<ApiResponse>(`${apiUrl}/api/v1/identify`, formData);
      setResults(response.data.results);
    } catch (err) {
      let msg = 'Could not connect to the server or an unknown error occurred.';
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        msg = err.response.data.detail;
      }
      setError(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head><title>WhatTheFont Pro</title></Head>
      <main className={styles.main}>
        <h1 className={styles.title}>WhatTheFont Pro</h1>
        <p className={styles.description}>Upload an image to identify the font.</p>
        <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
          <input {...getInputProps()} />
          {preview ? <img src={preview} alt="Preview" className={styles.previewImage} /> : <p>Drag & drop an image here</p>}
        </div>
        {file && <button onClick={handleIdentify} disabled={isLoading} className={styles.identifyButton}>{isLoading ? 'Analyzing...' : 'Identify Font'}</button>}
        {error && <p className={styles.errorMessage}>{error}</p>}
        {results && <div className={styles.resultsContainer}><h2>Top Matches</h2><ul>{results.map((r) => <li key={r.font_name} className={styles.resultItem}><h3>{r.font_name}</h3><p>Foundry: {r.foundry}</p><p>Confidence: <strong>{(`${(r.similarity * 100).toFixed(1)}%`)}</strong></p><a href={r.purchase_url} target="_blank" rel="noopener noreferrer">Get Font →</a></li>)}</ul></div>}
      </main>
    </div>
  );
};
export default Home;
