import * as React from 'react';
import { RouteComponentProps } from '@reach/router';

export interface Props extends RouteComponentProps {
  package?: string;
}

const Package = ({ package: packageName }: Props) => (
  <>
    <h1>Package details for {packageName}</h1>
    some other details...
  </>
);

export default Package;
