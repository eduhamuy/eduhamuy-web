'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 20;

type Document = {
  document_id: string;
  document_title: string;
};

type SearchResult = Document & {
  similarity_score: number;
};

type SearchResponse = {
  results?: SearchResult[];
  detail?: string;
};

type CatalogResponse = {
  documents?: Document[];
  total?: number;
  detail?: string;
};

function isSearchResult(document: Document): document is SearchResult {
  return 'similarity_score' in document && typeof (document as SearchResult).similarity_score === 'number';
}

type Account = {
  name: string;
  email: string | null;
};

export default function SearchClient({
  account,
  signOutAction,
}: {
  account: Account | null;
  signOutAction: () => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [catalog, setCatalog] = useState<Document[]>([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogOffset, setCatalogOffset] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [mode, setMode] = useState<'catalog' | 'search'>('catalog');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCatalog = useCallback(async (offset: number) => {
    const response = await fetch(`/api/documents?limit=${PAGE_SIZE}&offset=${offset}`, { cache: 'no-store' });
    const body = (await response.json()) as CatalogResponse;
    if (!response.ok) throw new Error(body.detail ?? 'No se pudo cargar el catálogo de documentos.');
    return { documents: body.documents ?? [], total: body.total ?? 0 };
  }, []);

  useEffect(() => {
    let active = true;
    void fetchCatalog(0)
      .then(({ documents, total }) => {
        if (!active) return;
        setCatalog(documents);
        setCatalogTotal(total);
        setCatalogOffset(0);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : 'No se pudo conectar con el catálogo de documentos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchCatalog]);

  async function loadCatalog(offset = 0) {
    setLoading(true);
    setError('');
    try {
      const next = await fetchCatalog(offset);
      setCatalog(next.documents);
      setCatalogTotal(next.total);
      setCatalogOffset(offset);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo conectar con el catálogo de documentos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setResults([]);
      setMode('catalog');
      setSelectedDocument(null);
      setError('Ingresa un término de búsqueda para continuar.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSelectedDocument(null);
    setMode('search');

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}&limit=5`, { cache: 'no-store' });
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

  function returnToCatalog() {
    setQuery('');
    setResults([]);
    setSelectedDocument(null);
    setError('');
    setMode('catalog');
    void loadCatalog(0);
  }

  const visibleDocuments: Document[] = mode === 'search' ? results : catalog;
  const firstDocument = catalogTotal === 0 ? 0 : catalogOffset + 1;
  const lastDocument = Math.min(catalogOffset + catalog.length, catalogTotal);

  return (
    <main className="search-page">
      <section className="search-header" aria-labelledby="search-title">
        <div className="search-title-row">
          <h1 id="search-title">Buscar documentos</h1>
          <nav className="search-account-actions" aria-label="Navegación de cuenta">
            <Link href="/">Inicio</Link>
            {account && (
              <>
                <span title={account.email ?? undefined}>Hola, {account.name}</span>
                <form action={signOutAction}>
                  <button type="submit">Cerrar sesión</button>
                </form>
              </>
            )}
          </nav>
        </div>
        <p>
          Explora los documentos académicos disponibles en el corpus actual. Al realizar una búsqueda, los resultados se
          ordenan por relevancia estimada. Revisa el PDF original antes de usar su contenido.
        </p>
        <form noValidate onSubmit={handleSubmit}>
          <label htmlFor="search-query">Término de búsqueda</label>
          <div className="search-controls">
            <input
              id="search-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej. educación superior"
              required
              aria-describedby={error ? 'search-error' : undefined}
              aria-invalid={!query.trim() && Boolean(error)}
            />
            <button type="submit" disabled={loading}>
              {loading && mode === 'search' ? 'Buscando...' : 'Buscar'}
            </button>
            {mode === 'search' && (
              <button type="button" onClick={returnToCatalog} disabled={loading}>
                Ver catálogo
              </button>
            )}
          </div>
        </form>
        {error && (
          <p id="search-error" role="alert">
            {error}
          </p>
        )}
        {account && (
          <section className="management-demo" aria-labelledby="management-demo-title">
            <h2 id="management-demo-title">Gestión de documentos</h2>
            <p>Demostración de funciones administrativas. Estas acciones aún no modifican el corpus ni el índice.</p>
            <div className="management-actions">
              <button type="button" disabled>
                Subir PDF
              </button>
              <button type="button" disabled>
                Reindexar corpus
              </button>
              <button type="button" disabled>
                Editar metadatos
              </button>
              <button type="button" disabled>
                Eliminar PDF
              </button>
            </div>
          </section>
        )}
      </section>

      <section className="document-workspace" aria-live="polite">
        <section className="document-list" aria-labelledby="document-list-title">
          <h2 id="document-list-title">{mode === 'search' ? 'Resultados de búsqueda' : 'Catálogo de documentos'}</h2>
          {mode === 'catalog' && catalogTotal > 0 && (
            <p>
              Mostrando {firstDocument}–{lastDocument} de {catalogTotal} documentos.
            </p>
          )}
          {!loading && !error && mode === 'search' && results.length === 0 && <p>No se encontraron resultados.</p>}
          {!loading && !error && mode === 'catalog' && catalog.length === 0 && <p>No hay documentos disponibles.</p>}
          {visibleDocuments.length > 0 && (
            <ol className="document-items" start={mode === 'catalog' ? catalogOffset + 1 : 1}>
              {visibleDocuments.map((document) => (
                <li key={document.document_id}>
                  <button
                    type="button"
                    className="document-title"
                    onClick={() => setSelectedDocument(document)}
                    aria-pressed={selectedDocument?.document_id === document.document_id}
                  >
                    {document.document_title}
                  </button>
                  {isSearchResult(document) && <span> — relevancia: {document.similarity_score.toFixed(4)}</span>}
                </li>
              ))}
            </ol>
          )}
          {mode === 'catalog' && catalogTotal > PAGE_SIZE && (
            <nav className="catalog-pagination" aria-label="Paginación del catálogo">
              <button
                type="button"
                onClick={() => void loadCatalog(catalogOffset - PAGE_SIZE)}
                disabled={loading || catalogOffset === 0}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => void loadCatalog(catalogOffset + PAGE_SIZE)}
                disabled={loading || catalogOffset + PAGE_SIZE >= catalogTotal}
              >
                Siguiente
              </button>
            </nav>
          )}
        </section>

        <aside className="document-preview" aria-labelledby="preview-title">
          <h2 id="preview-title">Vista previa</h2>
          {selectedDocument ? (
            <>
              <h3>{selectedDocument.document_title}</h3>
              <iframe
                key={selectedDocument.document_id}
                src={`/api/documents/${encodeURIComponent(selectedDocument.document_id)}/preview`}
                title={`Vista previa de ${selectedDocument.document_title}`}
              />
            </>
          ) : (
            <p>Selecciona un título para abrir el PDF.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
