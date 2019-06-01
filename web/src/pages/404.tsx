import * as React from 'react';
import { Link, RouteComponentProps } from '@reach/router';

export interface Props extends RouteComponentProps {}

const NotFound = (_props: Props) => (
  <>
    <h1>Page not found</h1>
    <Link to="/">Return to safer waters</Link>
  </>
);

export default NotFound;
