import { useFetch as _, Response } from './useFetch';

export interface PackageSummary {
  name: string;
  version: string;
}

export function usePackageSummary(
  name: string,
  version = 'latest'
): Response<PackageSummary> {
  // FIXME: remove mock
  return {
    loading: false,
    error: null,
    data: { name, version }
  };

  // return useFetch(`packages/${name}/${version}`);
}
