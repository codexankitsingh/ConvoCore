import type User from '#models/user'

/*
|--------------------------------------------------------------------------
| IUserRepository Interface
|--------------------------------------------------------------------------
|
| Dependency Inversion Principle:
| AuthService depends on THIS interface, not on UserRepository directly.
| This makes AuthService fully testable and the DB layer swappable.
|
*/
export interface IUserRepository {
  /** Find a user by UUID */
  findById(id: string): Promise<User | null>

  /** Find a user by email address (case-insensitive) */
  findByEmail(email: string): Promise<User | null>

  /** Create a new registered user */
  create(data: CreateUserDto): Promise<User>

  /** Create a guest user (no email/password) */
  createGuest(name: string): Promise<User>

  /** Check if an email is already registered */
  emailExists(email: string): Promise<boolean>
}

/*
|--------------------------------------------------------------------------
| DTOs (Data Transfer Objects)
|--------------------------------------------------------------------------
*/
export interface CreateUserDto {
  name: string
  email: string
  password: string
}
