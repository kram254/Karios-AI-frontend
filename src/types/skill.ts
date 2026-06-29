export interface Skill {
    id: string;
    owner_id: number;
    name: string;
    description?: string | null;
    tags?: string[];
    is_public?: boolean;
    definition?: Record<string, any>;
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface SkillCreate {
    name: string;
    description?: string | null;
    tags?: string[];
    is_public?: boolean;
    definition?: Record<string, any>;
}

export interface SkillUpdate {
    name?: string;
    description?: string | null;
    tags?: string[];
    is_public?: boolean;
    definition?: Record<string, any>;
}
