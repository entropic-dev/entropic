import { useState, useEffect } from 'react';

export interface Response<T> {
  loading: boolean;
  error: Error | null;
  data: T;
}

export function useFetch<T>(url: string): Response<T> {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(json => {
        setLoading(false);
        setData(json);
      })
      .catch(err => setError(err));
  }, [url]);

  return { loading, error, data };
}
