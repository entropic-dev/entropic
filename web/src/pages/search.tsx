import * as React from 'react';
import { RouteComponentProps } from '@reach/router';

export interface Props extends RouteComponentProps {}

const Search = (_props: Props) => (
  <>
    <h1>Search for a package</h1>
    <input />
  </>
);

export default Search;
