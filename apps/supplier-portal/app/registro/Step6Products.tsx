import { useState, useEffect } from 'react';
import { Card, Input, Button } from '@sercop/design-system';
import { api } from '@sercop/api-client';

interface Step6ProductsProps {
  initialActivityCodes: string[];
  onNext: (codes: string[]) => Promise<void>;
  onBack: () => void;
}

export function Step6Products({ initialActivityCodes, onNext, onBack }: Step6ProductsProps) {
  const [activityCodes, setActivityCodes] = useState<string[]>(initialActivityCodes || []);
  const [cpcSearch, setCpcSearch] = useState('');
  const [cpcSuggestions, setCpcSuggestions] = useState<Array<{ code: string; description: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cpcSearch.trim()) { setCpcSuggestions([]); return; }
    const t = setTimeout(() => {
      api.getCpcSuggestions({ q: cpcSearch, limit: 10 })
         .then((r) => setCpcSuggestions(r.data || []))
         .catch(() => setCpcSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [cpcSearch]);

  const handleAdd = (code: string) => {
    if (!activityCodes.includes(code)) {
      setActivityCodes([...activityCodes, code]);
    }
    setCpcSearch('');
    setCpcSuggestions([]);
    setError('');
  };

  const handleRemove = (code: string) => {
    setActivityCodes(activityCodes.filter(c => c !== code));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activityCodes.length === 0) {
      setError('Debe seleccionar al menos un producto o servicio (código CPC).');
      return;
    }
    setLoading(true);
    try {
      await onNext(activityCodes);
    } catch(err) {
      setError('Error al guardar productos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Productos (Clasificador CPC)" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-text-secondary mb-4">
          Busque y agregue los bienes, obras o servicios que desea proveer al Estado, de acuerdo al Clasificador Central de Productos (CPC).
        </p>

        <div className="mb-4">
          <Input
            placeholder="Ej: Computadoras, limpieza, consultoría..."
            value={cpcSearch}
            onChange={(e) => setCpcSearch(e.target.value)}
            className="w-full"
          />
          {cpcSuggestions.length > 0 && (
            <ul className="mt-1 max-h-48 overflow-y-auto rounded border border-neutral-200 bg-white py-1 text-sm shadow-md absolute z-10 w-full lg:max-w-xl">
              {cpcSuggestions.map((s) => (
                <li key={s.code}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-neutral-50 focus:bg-neutral-100 outline-none"
                    onClick={() => handleAdd(s.code)}
                  >
                    <span className="font-semibold text-primary">{s.code}</span> – {s.description}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">Productos Seleccionados ({activityCodes.length})</h4>
          {activityCodes.length === 0 ? (
            <div className="rounded border border-dashed border-neutral-300 p-4 text-center text-sm text-text-muted">
              Aún no ha agregado ningún producto. Utilice el buscador de arriba.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activityCodes.map((code) => (
                <span key={code} className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800 border border-blue-200 shadow-sm animate-in zoom-in-95 duration-200">
                  {code}
                  <button
                    type="button"
                    className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-blue-200 text-blue-600 focus:outline-none"
                    onClick={() => handleRemove(code)}
                    title="Eliminar"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>Regresar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar y Continuar'}</Button>
        </div>
      </form>
    </Card>
  );
}
