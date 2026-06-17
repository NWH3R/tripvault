export interface Trip {
  id: string;
  name: string;
  unlock_at: string;
  created_at: string;
  created_by: string | null;
}

export interface Photo {
  id: string;
  trip_id: string;
  storage_path: string;
  uploaded_by_name: string | null;
  created_at: string;
}
