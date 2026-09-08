/**
 * Backend the app talks to — the same Spring Boot API the XetaX web panel uses.
 * Production is the default; the login screen's "Server" switch flips to local
 * while developing (Android emulator reaches the host at 10.0.2.2).
 */
export const API_BASE_URL = 'https://api.xetacrm.pro/';
export const API_BASE_URL_LOCAL = 'http://10.0.2.2:8085/';

export const APP_NAME = 'XetaX CRM';
export const APP_TAGLINE = 'Sell, support and get paid';
export const PANEL_URL = 'https://app.xetacrm.pro';
