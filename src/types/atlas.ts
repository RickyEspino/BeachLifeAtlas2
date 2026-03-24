export interface AtlasNode {
  id: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  description: string;
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
}
