export interface User {
    id: number;
    uuid: string;
    email: string;
    [key: string]: any; // Для других полей, которые могут прийти в будущем
}

export interface LoginResponse {
    token: string;
    user: User;
}
