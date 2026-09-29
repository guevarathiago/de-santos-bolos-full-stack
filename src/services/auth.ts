import { api } from './api';

export type User = {
  id: string;
  name: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  celular: string;
  cep: string;
};

type AuthResponse = {
  user: User;
};

export const login = async (payload: LoginPayload) => {
  const { data } = await api.post<AuthResponse>('/login', payload);
  return data;
};

export const register = async (payload: RegisterPayload) => {
  const { data } = await api.post<AuthResponse>('/register', payload);
  return data;
};
