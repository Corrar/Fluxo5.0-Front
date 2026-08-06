// lib/api.js — cliente HTTP único do Fluxo Royale ERP.
//
// PORTADO 1:1 de Frontend-5.0-App/src/lib/api.ts (validado contra o backend real,
// branch 002-FR5.0, rotas na RAIZ sem /api), reescrito de TS strict para JS e
// adaptado à arquitetura window-globals do design: além dos `export`, expõe
// `window.FRApi` (instância axios) e `window.FRApiUtil` (helpers) para as telas
// consumirem nas próximas etapas. NÃO renderiza nada — só monta o cliente.
//
// Mantém: base URL via VITE_API_URL, interceptor Bearer, 401 -> logout
// (evento 'auth:unauthorized'), normalização de erro para { status, message, raw }.
import axios from 'axios';

// ---- Chaves de sessão no localStorage (mesmas do ref-front, p/ compatibilidade) ----
export const AUTH_KEYS = {
  token: 'auth_token',
  user: 'user_data',
  profile: 'user_profile',
  permissions: 'user_permissions',
};

// LIMPA AS QUATRO, SEMPRE — e isso é carga estrutural, não detalhe.
//
// Verificado em 06/08/2026 (dívida (f), fase 4 / etapa 0): é `Object.values(AUTH_KEYS)`, então
// nenhuma chave de sessão sobra órfã por aqui, e os dois caminhos de saída (logout e o 401 do
// interceptor) usam esta função. **Limpeza parcial seria a outra porta de entrada da
// inconsistência** — token de uma sessão convivendo com profile de outra. Se alguém precisar um
// dia limpar só um pedaço, que seja outra função com outro nome: esta é tudo-ou-nada de propósito.
export function clearAuthStorage() {
  Object.values(AUTH_KEYS).forEach((k) => localStorage.removeItem(k));
}

// ---- Loader global anti-flicker (só aparece se passar de ~300ms; pula GET) ----
// Mantido por fidelidade ao cliente original. Nenhuma tela assina no Etapa 0.
let listeners = [];
let activeRequests = 0;
let loadingTimer = null;
let isLoaderVisible = false;

export function subscribeToLoading(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyLoading(value) {
  for (const l of listeners) l(value);
}

function handleRequestStart() {
  activeRequests++;
  if (activeRequests === 1) {
    loadingTimer = setTimeout(() => {
      isLoaderVisible = true;
      notifyLoading(true);
    }, 300);
  }
}

function handleRequestEnd() {
  activeRequests--;
  if (activeRequests <= 0) {
    activeRequests = 0;
    if (loadingTimer) {
      clearTimeout(loadingTimer);
      loadingTimer = null;
    }
    if (isLoaderVisible) {
      isLoaderVisible = false;
      notifyLoading(false);
    }
  }
}

// ---- Base URL: SEMPRE via VITE_API_URL (rotas na raiz, sem /api) ----
function getBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv) return fromEnv;
  const { hostname } = window.location;
  if (hostname === 'localhost') return 'http://localhost:3000';
  return `http://${hostname}:3000`;
}

export const api = axios.create({ baseURL: getBaseUrl() });

// ---- Interceptor de request: Bearer + loader ----
api.interceptors.request.use(
  (config) => {
    // ===== DETECTOR DE DIVERGÊNCIA, PONTO 1: A GARANTIA — dívida (f), fase 4 / etapa 1 =====
    //
    // Este interceptor é o FUNIL ÚNICO de tudo que AGE. Se o token do localStorage não é mais o
    // que montou a sessão em memória, a request NÃO PARTE — a ação errada não chega a acontecer,
    // em vez de acontecer e ser atribuída a outro no audit_log (que é append-only e não se corrige).
    //
    // POR REFERÊNCIA AO GLOBAL, não por import: api.js é importado por auth.js, e importar de
    // volta seria ciclo. Quando um request acontece, `window.FRAuth` existe há muito.
    //
    // FAIL-OPEN DE PROPÓSITO: sem `FRAuth` (ordem de carga inesperada, teste isolado) a request
    // segue. O risco desta etapa é o FALSO POSITIVO — na dúvida, deixa passar; o backend continua
    // sendo a barreira real.
    const A = typeof window !== 'undefined' ? window.FRAuth : null;
    if (A && typeof A.validarSessao === 'function' && !A.validarSessao()) {
      // Erro NOMEADO, não 401 genérico do servidor: quem trata sabe que a sessão caiu por
      // divergência local, e o `status: null` diz que isto nunca virou tráfego.
      const e = new Error('Sessão encerrada: outro usuário fez login neste navegador.');
      e.status = null;
      e.code = 'FR_SESSAO_DIVERGENTE';
      return Promise.reject(e);
    }

    const token = localStorage.getItem(AUTH_KEYS.token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isGet = config.method?.toLowerCase() === 'get';
    const shouldSkip =
      config.skipLoading !== undefined ? config.skipLoading : isGet;

    if (!shouldSkip) {
      config._usesLoader = true;
      handleRequestStart();
    }
    return config;
  },
  (error) => {
    if (error?.config?._usesLoader) handleRequestEnd();
    return Promise.reject(normalizeError(error));
  },
);

// ---- Interceptor de response: encerra loader, 401 -> logout, normaliza erro ----
api.interceptors.response.use(
  (response) => {
    if (response.config._usesLoader) handleRequestEnd();
    return response;
  },
  (error) => {
    if (error?.config?._usesLoader) handleRequestEnd();

    const status = error?.response?.status ?? null;
    if (status === 401) {
      // Token ausente/expirado: limpa a sessão e sinaliza. O FRAuth reage (logout).
      clearAuthStorage();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

// ---- Normalização: axios error -> { status, message, raw } ----
export function normalizeError(err) {
  const axErr = err;

  if (axErr?.response) {
    const status = axErr.response.status;
    const body = axErr.response.data;
    const message =
      body?.error ||
      body?.message ||
      (status >= 500
        ? 'Erro no servidor. Tente novamente.'
        : 'Não foi possível concluir a ação.');
    return { status, message, raw: body };
  }

  if (axErr?.request) {
    return {
      status: null,
      message: 'Sem conexão com o servidor. Verifique a rede e tente novamente.',
    };
  }

  // `code` PRESERVADO: é como um erro nomeado sobrevive à normalização. Sem ele, quem trata só
  // conseguiria distinguir por string de mensagem — frágil e intraduzível. É o caso do
  // 'FR_SESSAO_DIVERGENTE' (dívida (f), fase 4), e serve para qualquer erro futuro que precise ser
  // reconhecido por código em vez de texto. Erros do axios (ERR_NETWORK etc.) passam junto.
  return {
    status: null,
    code: axErr?.code,
    message: axErr?.message || 'Erro inesperado.',
  };
}

/** Type guard para tratar o erro propagado pelas queries/mutations. */
export function isApiError(e) {
  return (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    'status' in e
  );
}

/** Mensagem amigável a partir de qualquer erro. */
export function getErrorMessage(e) {
  if (isApiError(e)) return e.message;
  if (e instanceof Error) return e.message;
  return 'Erro inesperado.';
}

// ---- Exposição p/ a arquitetura window-globals do design ----
// As telas (Etapa 1+) consomem `window.FRApi.get/post/...` e os helpers.
if (typeof window !== 'undefined') {
  window.FRApi = api;
  window.FRApiUtil = {
    AUTH_KEYS,
    clearAuthStorage,
    normalizeError,
    isApiError,
    getErrorMessage,
    subscribeToLoading,
  };
}
