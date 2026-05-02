/*
|--------------------------------------------------------------------------
| VineJS Custom Error Reporter
|--------------------------------------------------------------------------
|
| Customizes validation error response format to be consistent
| across all API endpoints.
|
*/
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  // Generic
  required: 'The {{ field }} field is required',
  string: 'The {{ field }} must be a string',
  email: 'The {{ field }} must be a valid email address',
  minLength: 'The {{ field }} must be at least {{ min }} characters',
  maxLength: 'The {{ field }} must not exceed {{ max }} characters',
  confirmed: 'The {{ field }} confirmation does not match',
  unique: 'The {{ field }} has already been taken',
  exists: 'The selected {{ field }} is invalid',
  uuid: 'The {{ field }} must be a valid UUID',
  enum: 'The {{ field }} must be one of: {{ choices }}',
})
