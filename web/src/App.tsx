import * as React from 'react';
import { hot } from 'react-hot-loader/root';
import { Router } from '@reach/router';

import { Header } from './components/Header';

// routes
import Splash from './pages/splash';
import Search from './pages/search';
import Package from './pages/package';
import NotFound from './pages/404';

const App = () => (
  <>
    <Header />
    <div id="page-wrapper">
      <Router>
        <Splash path="/" />
        <Search path="/search" />
        <Package path="/package/:package" />
        <NotFound default />
      </Router>
    </div>
  </>
);

export default hot(App);
