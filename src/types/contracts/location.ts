export interface Location {
  id: string;
  fileId: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface CreateLocationInput {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
