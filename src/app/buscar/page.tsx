'use client';

import { FormEvent, useState } from 'react';

type SearchResult = {
  document_title: string;
  document_path: string;
  similarity_score: number;
};

type SearchResponse = {
  results?: SearchResult[];
  detail?: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}&limit=5`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as SearchResponse;

      if (!response.ok) {
        setError(body.detail ?? 'No se pudo realizar la búsqueda.');
      } else {
        setResults(body.results ?? []);
      }
    } catch {
      setError('No se pudo conectar con el servicio de búsqueda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Buscar documentos</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="search-query">Término de búsqueda</label>
        <input
          id="search-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej. educación superior"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
      {!loading && !error && query.trim() && results.length === 0 && <p>No se encontraron resultados.</p>}

      {results.length > 0 && (
        <ol>
          {results.map((result) => (
            <li key={result.document_path}>
              <strong>{result.document_title}</strong>
              <span> — similitud: {result.similarity_score.toFixed(4)}</span>
              <br />
              <small>{result.document_path}</small>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
