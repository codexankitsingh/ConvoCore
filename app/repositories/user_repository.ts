import User from '#models/user'
import type { IUserRepository, CreateUserDto } from './interfaces/i_user_repository.js'

/*
|--------------------------------------------------------------------------
| UserRepository
|--------------------------------------------------------------------------
|
| Concrete implementation of IUserRepository using Lucid ORM.
| Single Responsibility: ONLY handles user DB queries.
| All SQL/ORM logic lives here — nowhere else.
|
*/
export default class UserRepository implements IUserRepository {
  /**
   * Find user by UUID primary key
   */
  async findById(id: string): Promise<User | null> {
    return User.find(id)
  }

  /**
   * Find user by email — case-insensitive search
   */
  async findByEmail(email: string): Promise<User | null> {
    return User.query().whereRaw('LOWER(email) = ?', [email.toLowerCase()]).first()
  }

  /**
   * Create a new registered user
   * Note: password hashing handled by User model @beforeSave hook
   */
  async create(data: CreateUserDto): Promise<User> {
    return User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      isGuest: false,
    })
  }

  /**
   * Create a guest user — no email or password
   */
  async createGuest(name: string): Promise<User> {
    return User.create({
      name,
      email: null,
      password: null,
      isGuest: true,
    })
  }

  /**
   * Check if email already exists in the database
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await User.query()
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .select('id')
      .first()
    return !!user
  }
}
