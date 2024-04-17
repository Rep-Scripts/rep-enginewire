import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { isEnvBrowser } from './utils/misc';
import LocaleProvider from './providers/LocaleProvider';

if (isEnvBrowser()) {
  const root = document.getElementById('root');

  // https://i.imgur.com/iPTAdYV.png - Night time img

  // root!.style.backgroundImage = 'url("https://i.imgur.com/xKTzQ4X.jpeg")';
  root!.style.backgroundImage =
    'url("https://www.ps4wallpapers.com/wp-content/uploads/2017/05/PS4Wallpapers.com_20170507212406.png")';
  root!.style.backgroundSize = 'cover';
  root!.style.backgroundRepeat = 'no-repeat';
  root!.style.backgroundPosition = 'center';
}

const root = document.getElementById('root');
ReactDOM.createRoot(root!).render(
  <React.StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </React.StrictMode>
);
