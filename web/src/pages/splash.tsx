import * as React from 'react';
import { RouteComponentProps } from '@reach/router';
import { Hero } from '../components/Hero';
import { Card } from '../components/Card';

export interface Props extends RouteComponentProps {}

const Splash = (_props: Props) => (
  <div>
    <Hero />
    <Card>search...</Card>
  </div>
);

export default Splash;
