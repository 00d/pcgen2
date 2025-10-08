import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  // Auth endpoints
  async register(email: string, username: string, password: string) {
    const response = await this.client.post('/auth/register', { email, username, password });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Game Rules endpoints
  async getRaces() {
    const response = await this.client.get('/game-rules/races');
    return response.data.races;
  }

  async getRaceById(id: string) {
    const response = await this.client.get(`/game-rules/races/${id}`);
    return response.data.race;
  }

  async getClasses() {
    const response = await this.client.get('/game-rules/classes');
    return response.data.classes;
  }

  async getClassById(id: string) {
    const response = await this.client.get(`/game-rules/classes/${id}`);
    return response.data.class;
  }

  async getFeats() {
    const response = await this.client.get('/game-rules/feats');
    return response.data.feats;
  }

  async getSpells() {
    const response = await this.client.get('/game-rules/spells');
    return response.data.spells;
  }

  async getEquipment() {
    const response = await this.client.get('/game-rules/equipment');
    return response.data.equipment;
  }

  async getSkills() {
    const response = await this.client.get('/game-rules/skills');
    return response.data.skills;
  }

  // Character endpoints
  async getCharacters() {
    const response = await this.client.get('/characters');
    return response.data.characters;
  }

  async getCharacterById(id: string) {
    const response = await this.client.get(`/characters/${id}`);
    return response.data.character;
  }

  async createCharacter(name: string, campaign: string = 'Pathfinder 1e') {
    const response = await this.client.post('/characters', { name, campaign });
    return response.data.character;
  }

  async updateCharacter(id: string, data: any) {
    const response = await this.client.put(`/characters/${id}`, data);
    return response.data.character;
  }

  async deleteCharacter(id: string) {
    return this.client.delete(`/characters/${id}`);
  }

  async setCharacterRace(characterId: string, raceId: string) {
    const response = await this.client.post(`/characters/${characterId}/set-race`, { raceId });
    return response.data.character;
  }

  async addCharacterClass(characterId: string, classId: string) {
    const response = await this.client.post(`/characters/${characterId}/add-class`, { classId });
    return response.data.character;
  }
}

export const api = new ApiClient();
