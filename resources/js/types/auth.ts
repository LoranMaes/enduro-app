export type User = {
    id: number;
    name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    role?: 'athlete' | 'coach' | 'admin' | null;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    impersonating?: boolean;
    original_user?: User | null;
    impersonated_user?: User | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
