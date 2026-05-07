import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import type UploadService from '#services/upload_service'

/*
|--------------------------------------------------------------------------
| UploadController
|--------------------------------------------------------------------------
*/
export default class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/uploads/image
  |--------------------------------------------------------------------------
  */
  async image(ctx: HttpContext) {
    const user = (ctx as any).authUser

    const file = ctx.request.file('file')

    if (!file) {
      throw new Exception('No file provided. Use multipart field "file"', {
        status: 422,
        code: 'E_NO_FILE',
      })
    }

    const result = await this.uploadService.uploadImage(file, user.id)

    return ctx.response.created({
      message: 'Image uploaded successfully',
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | POST /api/v1/uploads/file
  |--------------------------------------------------------------------------
  */
  async file(ctx: HttpContext) {
    const user = (ctx as any).authUser

    const file = ctx.request.file('file')

    if (!file) {
      throw new Exception('No file provided. Use multipart field "file"', {
        status: 422,
        code: 'E_NO_FILE',
      })
    }

    const result = await this.uploadService.uploadFile(file, user.id)

    return ctx.response.created({
      message: 'File uploaded successfully',
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | GET /api/v1/uploads/:fileId
  |--------------------------------------------------------------------------
  */
  async show(ctx: HttpContext) {
    const fileId = ctx.params.fileId

    const result = await this.uploadService.getUpload(fileId)

    return ctx.response.ok({
      data: result,
    })
  }

  /*
  |--------------------------------------------------------------------------
  | DELETE /api/v1/uploads/:fileId
  |--------------------------------------------------------------------------
  */
  async destroy(ctx: HttpContext) {
    const user = (ctx as any).authUser
    const fileId = ctx.params.fileId

    await this.uploadService.deleteUpload(fileId, user.id)

    return ctx.response.ok({
      message: 'File deleted successfully',
      data: { fileId },
    })
  }
}
