import jwt from 'jsonwebtoken'
import redis from '@adonisjs/redis/services/main'
import hash from '@adonisjs/core/services/hash'
import { Exception } from '@adonisjs/core/exceptions'
import env from '#start/env'
import User from '#models/user'
import type {
  IAuthService,
  RegisterDto,
  LoginDto,
  AuthResult,
  TokenPair,
} from './interfaces/i_auth_service.js'
import type { IUserRepository } from '#repositories/interfaces/i_user_repository'

/*
|--------------------------------------------------------------------------
| AuthService
|--------------------------------------------------------------------------
*/
export default class AuthService implements IAuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  /*
  |--------------------------------------------------------------------------
  | Register
  |--------------------------------------------------------------------------
  */
  async register(data: RegisterDto): Promise<AuthResult> {
    // 1. Check email uniqueness
    const emailTaken = await this.userRepository.emailExists(data.email)
    if (emailTaken) {
      throw new Exception('Email address is already registered', {
        status: 409,
        code: 'E_EMAIL_TAKEN',
      })
    }

    // 2. Create user (password hashed by @beforeSave hook)
    const user = await this.userRepository.create(data)

    // 3. Generate token pair
    const tokens = await this.generateTokenPair(user)

    return this.buildAuthResult(user, tokens)
  }

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  |
  | Manual approach: find user by email → verify password with hash.verify()
  | We avoid withAuthFinder mixin because our email column is nullable
  | (guest users have no email) which breaks the mixin's query.
  |
  */
  async login(data: LoginDto): Promise<AuthResult> {
    // 1. Find user by email manually
    const user = await this.userRepository.findByEmail(data.email)

    // 2. User must exist, must not be guest, must have a password
    if (!user || user.isGuest || !user.password) {
      throw new Exception('Invalid email or password', {
        status: 401,
        code: 'E_INVALID_CREDENTIALS',
      })
    }

    // 3. Verify password directly using hash service
    let isValid = false
    try {
      isValid = await hash.verify(user.password, data.password)
    } catch {
      throw new Exception('Invalid email or password', {
        status: 401,
        code: 'E_INVALID_CREDENTIALS',
      })
    }

    if (!isValid) {
      throw new Exception('Invalid email or password', {
        status: 401,
        code: 'E_INVALID_CREDENTIALS',
      })
    }

    // 4. Generate token pair
    const tokens = await this.generateTokenPair(user)

    return this.buildAuthResult(user, tokens)
  }

  /*
  |--------------------------------------------------------------------------
  | Refresh Token
  |--------------------------------------------------------------------------
  */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    // 1. Verify JWT signature + expiry
    let payload: jwt.JwtPayload
    try {
      payload = jwt.verify(refreshToken, env.get('JWT_SECRET')) as jwt.JwtPayload
    } catch {
      throw new Exception('Invalid or expired refresh token', {
        status: 401,
        code: 'E_INVALID_REFRESH_TOKEN',
      })
    }

    // 2. Ensure it's a refresh token
    if (payload.type !== 'refresh') {
      throw new Exception('Invalid token type', {
        status: 401,
        code: 'E_INVALID_TOKEN_TYPE',
      })
    }

    const userId = payload.sub as string

    // 3. Check Redis — must exist and match (not revoked)
    const storedToken = await redis.get(`refresh_token:${userId}`)
    if (!storedToken || storedToken !== refreshToken) {
      throw new Exception('Refresh token has been revoked', {
        status: 401,
        code: 'E_REFRESH_TOKEN_REVOKED',
      })
    }

    // 4. Load user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Exception('User not found', {
        status: 404,
        code: 'E_USER_NOT_FOUND',
      })
    }

    // 5. Issue new token pair (rotation)
    return this.generateTokenPair(user)
  }

  /*
  |--------------------------------------------------------------------------
  | Create Guest
  |--------------------------------------------------------------------------
  */
  async createGuest(): Promise<AuthResult> {
    const guestName = `Guest_${Date.now().toString(36).toUpperCase()}`
    const user = await this.userRepository.createGuest(guestName)
    const tokens = await this.generateTokenPair(user)
    return this.buildAuthResult(user, tokens)
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */
  async logout(userId: string, accessToken: string): Promise<void> {
    // 1. Remove refresh token from Redis
    await redis.del(`refresh_token:${userId}`)

    // 2. Blacklist access token for its remaining TTL
    try {
      const decoded = jwt.decode(accessToken) as jwt.JwtPayload
      if (decoded?.exp) {
        const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000)
        if (ttlSeconds > 0) {
          await redis.setex(`blacklist:${accessToken}`, ttlSeconds, '1')
        }
      }
    } catch {
      // Token already invalid — logout still succeeds
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Get Current User
  |--------------------------------------------------------------------------
  */
  async me(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Exception('User not found', {
        status: 404,
        code: 'E_USER_NOT_FOUND',
      })
    }
    return user
  }

  /*
  |--------------------------------------------------------------------------
  | Private: Generate JWT Token Pair
  |--------------------------------------------------------------------------
  */
  private async generateTokenPair(user: User): Promise<TokenPair> {
    const secret = env.get('JWT_SECRET')
    const accessExpiresIn = env.get('JWT_ACCESS_EXPIRES_IN')
    const refreshExpiresIn = env.get('JWT_REFRESH_EXPIRES_IN')
    const accessTtl = this.parseExpiryToSeconds(accessExpiresIn)
    const refreshTtl = this.parseExpiryToSeconds(refreshExpiresIn)

    // Short-lived access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        isGuest: user.isGuest,
        type: 'access',
      },
      secret,
      { expiresIn: accessTtl }
    )

    // Long-lived refresh token
    const refreshToken = jwt.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      secret,
      { expiresIn: refreshTtl }
    )

    // Store refresh token in Redis
    await redis.setex(`refresh_token:${user.id}`, refreshTtl, refreshToken)

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl,
    }
  }

  /**
   * Parse JWT expiry strings like '15m', '7d', '1h' to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/)
    if (!match) return 900 // default 15 minutes

    const value = parseInt(match[1], 10)
    const unit = match[2]

    switch (unit) {
      case 's': return value
      case 'm': return value * 60
      case 'h': return value * 3600
      case 'd': return value * 86400
      default: return 900
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Private: Build Auth Response
  |--------------------------------------------------------------------------
  */
  private buildAuthResult(user: User, tokens: TokenPair): AuthResult {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isGuest: user.isGuest,
        createdAt: user.createdAt.toISO()!,
      },
      tokens,
    }
  }
}
