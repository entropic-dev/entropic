import * as React from 'react';
import { hot } from 'react-hot-loader/root';

import Package from './components/Package/Package';

const App = () => (
  <div>
    app works!
    {[0, 1, 2, 3].map(key => (
      <Package key={key} />
    ))}
  </div>
);

export default hot(App);
