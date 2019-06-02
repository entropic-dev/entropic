import * as React from 'react';
import { RouteComponentProps } from '@reach/router';
import { Input } from '../components/Input';
import { Heading2 } from '../components/Heading';

export interface Props extends RouteComponentProps {}

const Search = (_props: Props) => (
  <>
    <Heading2>Search for a package</Heading2>
    <Input placeholder="search..." />
  </>
);

export default Search;
