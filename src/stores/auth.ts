import { ref } from 'vue';
import { defineStore } from 'pinia';
import { type InternalAxiosRequestConfig } from 'axios';
import type { accessTokenClaims, TokenPair, UserProxy } from '@/types';
import rawApi from '@/api/rawApi';
import api from '@/api/api';
import { useGlobalStore } from './global';

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref<string | null>(null);
    const refreshToken = ref<string | null>(null);

    const accessTokenKey = "access_token";
    const refreshTokenKey = "refresh_token";

    const isModelOpen = ref<boolean>(false);
    const isUnauthModalOpen = ref<boolean>(false);

    const modelMode = ref<"signup" | "login">("signup");
    let modalCallback = () => { };

    const currentUser = ref<UserProxy | null>(null);

    const global = useGlobalStore();

    async function login(username: string, password: string) {
        global.startFetching();
        let response;
        try {
            response = await rawApi.post<TokenPair>('/auth/login', { username, password });
        } finally {
            global.stopFetching();
        }

        if (response.status != 200) return response;

        saveTokens(response.data.accessToken, response.data.refreshToken);
        return response;
    }

    async function signUp(username: string, email: string, firstname: string, lastname: string, password: string) {
        global.startFetching();
        let response;
        try {
            response = await rawApi.post<TokenPair>('/auth/register', {
                username: username,
                firstName: firstname,
                lastName: lastname,
                email: email,
                password: password
            });
        } finally {
            global.stopFetching();
        }

        if (response.status != 201) return response;

        saveTokens(response.data.accessToken, response.data.refreshToken);
        return response;
    }

    function logout() {
        clearTokens();
        currentUser.value = null;
    }

    async function getUserProxy() {
        if (currentUser.value) return currentUser.value;

        global.startFetching();
        let response;
        try {
            response = await api.get<UserProxy>("/me");
        } finally {
            global.stopFetching();
        }

        if (response.status != 200) {
            logout()
            return null
        }

        response.data.user.userProxies = response.data.user.userProxies.map(p => p == null ? response.data : p)

        currentUser.value = response.data;
        return currentUser.value;
    }

    function getUserProxyId() {
        if (!isAuthenticated()) return "NotFound";
        const decodedPayload = decodeToken(accessToken.value!);

        return decodedPayload.uid;
    }

    function isAuthenticated() {
        loadTokens();

        if (!accessToken.value) return false;
        if (isTokenExpired(accessToken.value)) return false;

        return true;
    }

    function isAdmin() {
        if (!isAuthenticated()) return false;
        // const decodedPayload = decodeToken(accessToken.value!);

        return false;
    }

    function saveTokens(aToken: string, rToken: string) {
        accessToken.value = aToken;
        refreshToken.value = rToken;
        localStorage.setItem(accessTokenKey, aToken);
        localStorage.setItem(refreshTokenKey, rToken);
    }

    function clearTokens() {
        accessToken.value = null;
        refreshToken.value = null;
        localStorage.removeItem(accessTokenKey);
        localStorage.removeItem(refreshTokenKey);
    }

    async function refreshTokens() {
        try {
            if (!refreshToken.value) {
                throw new Error("No refresh token available");
            }

            global.startFetching();
            const response = await rawApi.post('/auth/refresh', {
                refresh_token: refreshToken.value
            });

            saveTokens(response.data.access_token, response.data.refresh_token);
            return response.data.access_token;
        } catch (error) {
            console.error("Failed to refresh token", error);
            clearTokens();
            return null;
        } finally {
            global.stopFetching();
        }
    }

    function loadTokens() {
        accessToken.value = localStorage.getItem(accessTokenKey);
        refreshToken.value = localStorage.getItem(refreshTokenKey);
    }

    async function applyHeaders(config: InternalAxiosRequestConfig) {
        loadTokens();

        if (accessToken.value && isTokenExpired(accessToken.value)) {
            accessToken.value = await refreshTokens();
        }

        else if (!accessToken.value && refreshToken.value) {
            accessToken.value = await refreshTokens();
        }

        if (accessToken.value) {
            config.headers.Authorization = `Bearer ${accessToken.value}`;
        }

        return config;
    }

    function decodeToken(token: string) {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload)) as accessTokenClaims;
        return decodedPayload;
    }

    function isTokenExpired(token: string): boolean {
        const decodedPayload = decodeToken(token);
        return decodedPayload.exp < Math.floor(Date.now() / 1000);
    }

    function setModelMode(newNodalMode: "signup" | "login") {
        modelMode.value = newNodalMode;
    }

    function setModelOpen(newModelState: boolean) {
        isModelOpen.value = newModelState;

        if (newModelState) modalCallback();
    }

    function setModelOpenCallback(callback: () => void) {
        modalCallback = callback;
    }

    function setUnauthModalOpen(newModelState: boolean) {
        isUnauthModalOpen.value = newModelState;
    }

    return {
        applyHeaders,
        saveTokens,
        clearTokens,
        refreshTokens,
        isAuthenticated,
        isAdmin,
        login,
        signUp,
        logout,
        getUserProxyId,
        getUserProxy,
        setModelOpen,
        isModelOpen,
        setModelMode,
        modelMode,
        setModelOpenCallback,
        setUnauthModalOpen,
        isUnauthModalOpen,
    };
});
