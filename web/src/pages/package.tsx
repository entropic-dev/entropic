import * as React from 'react';
import { RouteComponentProps } from '@reach/router';
import { usePackageSummary } from '../hooks/usePackageSummary';

export interface Props extends RouteComponentProps {
  name?: string;
  version?: string;
}

const Package = ({ name, version = 'latest' }: Props) => {
  const { loading, error, data } = usePackageSummary(name, version);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <>
      <h1>Package details for {name}</h1>
      {JSON.stringify(data)}
    </>
  );
};

export default Package;
