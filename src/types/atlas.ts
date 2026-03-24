export interface AtlasNode {
  id?: string;
  place_id?: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  description: string;
  points_reward?: number;
  sort_order?: number;
}
export interface TripRecord {
  id: string;
  title: string;
  zone: string;
  user_input?: string | null;
  vibe?: string | null;
  created_at: string;
}

export interface AtlasEdge {
  from: string;
  to: string;
  mode: string;
}

export interface AtlasExperience {
  title: string;
  zone: string;
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  summary?: string;
}
