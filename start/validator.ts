import vine, { SimpleMessagesProvider } from '@vinejs/vine'

/*
|--------------------------------------------------------------------------
| VineJS Global Messages
|--------------------------------------------------------------------------
| Consistent validation error messages across all validators.
*/
vine.messagesProvider = new SimpleMessagesProvider({
  required: 'The {{ field }} field is required',
  string: 'The {{ field }} must be a string',
  email: 'The {{ field }} must be a valid email address',
  minLength: 'The {{ field }} must be at least {{ min }} characters',
  maxLength: 'The {{ field }} must not exceed {{ max }} characters',
  boolean: 'The {{ field }} must be a boolean',
  uuid: 'The {{ field }} must be a valid UUID',
  enum: 'The {{ field }} must be one of: {{ choices }}',
})
