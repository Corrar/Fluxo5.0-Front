// globals.js — expõe React/ReactDOM no escopo global ANTES de qualquer part.
// Os arquivos em parts/*.jsx usam `React.useState`, `ReactDOM.createRoot`, etc.
// como globais (padrão do protótipo original, que compartilha tudo via window).
// Este módulo é o PRIMEIRO import de main.jsx, então roda antes dos parts.
import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';

window.React = React;
window.ReactDOM = Object.assign({}, ReactDOM, { createRoot });
