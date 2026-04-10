export type Database = {
  public: {
    Tables: {
      parking_spots: {
        Row: {
          id: string;
          user_id: string;
          lat: number;
          lng: number;
          vacated_at: string;
          expires_at: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          lat: number;
          lng: number;
          expires_at?: string;
          is_available?: boolean;
        };
        Update: Partial<Database['public']['Tables']['parking_spots']['Insert']>;
      };
    };
  };
};
