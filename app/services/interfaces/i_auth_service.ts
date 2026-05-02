import type User from '#models/user'

/*
|--------------------------------------------------------------------------
| IAuthService Interface
|--------------------------------------------------------------------------
|
| Defines the contract for all authentication operations.
| AuthController depends on THIS interface (Dependency Inversion).
| Open/Closed: new auth strategies can extend without modifying this.
|
*/
export interface IAuthService {
  /** Register a new user → returns user + token pair */
  register(data: RegisterDto): Promise<AuthResult>

  /** Login with email/password → returns user + token pair */
  login(data: LoginDto): Promise<AuthResult>

  /** Exchange refresh token → returns new token pair */
  refreshToken(refreshToken: string): Promise<TokenPair>

  /** Create anonymous guest session → returns guest user + tokens */
  createGuest(): Promise<AuthResult>

  /** Logout → invalidate tokens in Redis */
  logout(userId: string, accessToken: string): Promise<void>

  /** Get authenticated user profile */
  me(userId: string): Promise<User>
}

/*
|--------------------------------------------------------------------------
| DTOs
|--------------------------------------------------------------------------
*/
export interface RegisterDto {
  name: string
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResult {
  user: {
    id: string
    name: string
    email: string | null
    isGuest: boolean
    createdAt: string
  }
  tokens: TokenPair
}
