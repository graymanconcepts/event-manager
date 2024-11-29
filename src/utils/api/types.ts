// API Response Types
export interface LoginResponse {
    token: string;
}

export interface Speaker {
    id: number;
    name: string;
    role: string;
    bio?: string;
    image_url?: string;
    company?: string;
    talkTitle?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Talk {
    id: number;
    title: string;
    description: string;
    speaker_id: number;
    speaker?: Speaker;
    start_time: string;  // Updated to match database field
    end_time: string;    // Updated to match database field
    room?: string;
    created_at: string;
    updated_at: string;
}
