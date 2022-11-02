import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {HashRouter} from 'react-router-dom'

const root = ReactDOM.createRoot(document.getElementById('root'));

const render = () => {
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}

if (!window.__MICRO_WEB__) {
  render()
}

export const bootstrap = () => {
  console.log('开始加载')
}


export const mount = () => {
  render()
}

export const unmount = () => {
  console.log('卸载')
}