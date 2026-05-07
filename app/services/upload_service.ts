import { randomUUID } from 'node:crypto'
import { createWriteStream, existsSync, unlinkSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { Exception } from '@adonisjs/core/exceptions'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
import Upload from '#models/upload'

/*
|--------------------------------------------------------------------------
| UploadService
|--------------------------------------------------------------------------
|
| Handles file uploads, validation, storage and deletion.
| Files are stored in storage/uploads/{images|files}/
| Served via /uploads/{images|files}/{filename}
|
*/
export default class UploadService {
  /*
  |--------------------------------------------------------------------------
  | Config
  |--------------------------------------------------------------------------
  */
  private readonly config = {
    image: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedMimes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      allowedExts: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      folder: 'images',
    },
    file: {
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedMimes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed',
      ],
      allowedExts: ['.pdf', '.doc', '.docx', '.txt', '.zip'],
      folder: 'files',
    },
  }

  /*
  |--------------------------------------------------------------------------
  | Upload Image
  |--------------------------------------------------------------------------
  */
  async uploadImage(file: MultipartFile, userId: string): Promise<UploadResult> {
    return this.processUpload(file, userId, 'image')
  }

  /*
  |--------------------------------------------------------------------------
  | Upload File
  |--------------------------------------------------------------------------
  */
  async uploadFile(file: MultipartFile, userId: string): Promise<UploadResult> {
    return this.processUpload(file, userId, 'file')
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Upload
  |--------------------------------------------------------------------------
  */
  async deleteUpload(fileId: string, userId: string): Promise<void> {
    const upload = await Upload.find(fileId)

    if (!upload) {
      throw new Exception('File not found', {
        status: 404,
        code: 'E_FILE_NOT_FOUND',
      })
    }

    if (upload.userId !== userId) {
      throw new Exception('You can only delete your own files', {
        status: 403,
        code: 'E_FORBIDDEN',
      })
    }

    // Delete from disk
    const filePath = app.makePath('storage/uploads', upload.path)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }

    // Delete from DB
    await upload.delete()
  }

  /*
  |--------------------------------------------------------------------------
  | Get Upload Metadata
  |--------------------------------------------------------------------------
  */
  async getUpload(fileId: string): Promise<UploadResult> {
    const upload = await Upload.find(fileId)

    if (!upload) {
      throw new Exception('File not found', {
        status: 404,
        code: 'E_FILE_NOT_FOUND',
      })
    }

    return this.buildResult(upload)
  }

  /*
  |--------------------------------------------------------------------------
  | Private: Process Upload
  |--------------------------------------------------------------------------
  */
  private async processUpload(
    file: MultipartFile,
    userId: string,
    category: 'image' | 'file'
  ): Promise<UploadResult> {
    const cfg = this.config[category]

    // Validate file exists
    if (!file) {
      throw new Exception('No file provided', {
        status: 422,
        code: 'E_NO_FILE',
      })
    }

    // Validate file size
    if (file.size > cfg.maxSize) {
      throw new Exception(`File too large. Max size is ${cfg.maxSize / 1024 / 1024}MB`, {
        status: 422,
        code: 'E_FILE_TOO_LARGE',
      })
    }

    // Validate MIME type
    const mimeType = file.headers['content-type'] ?? file.type ?? ''
    if (!cfg.allowedMimes.includes(mimeType)) {
      throw new Exception(`Invalid file type. Allowed: ${cfg.allowedExts.join(', ')}`, {
        status: 422,
        code: 'E_INVALID_FILE_TYPE',
      })
    }

    // Validate extension
    const originalName = file.clientName ?? 'unknown'
    const ext = extname(originalName).toLowerCase()
    if (!cfg.allowedExts.includes(ext)) {
      throw new Exception(`Invalid file extension. Allowed: ${cfg.allowedExts.join(', ')}`, {
        status: 422,
        code: 'E_INVALID_EXTENSION',
      })
    }

    // Generate unique stored name
    const storedName = `${randomUUID()}${ext}`
    const relativePath = `${cfg.folder}/${storedName}`
    const absolutePath = app.makePath('storage/uploads', relativePath)

    // Ensure directory exists
    await mkdir(app.makePath('storage/uploads', cfg.folder), {
      recursive: true,
    })

    // Move file to storage
    await file.move(app.makePath('storage/uploads', cfg.folder), {
      name: storedName,
      overwrite: false,
    })

    // Build public URL
    const url = `/uploads/${relativePath}`

    // Save to DB
    const upload = await Upload.create({
      userId,
      originalName,
      storedName,
      mimeType,
      category,
      disk: 'local',
      path: relativePath,
      url,
      size: file.size,
    })

    return this.buildResult(upload)
  }

  /*
  |--------------------------------------------------------------------------
  | Private: Build Result
  |--------------------------------------------------------------------------
  */
  private buildResult(upload: Upload): UploadResult {
    return {
      id: upload.id,
      userId: upload.userId,
      originalName: upload.originalName,
      mimeType: upload.mimeType,
      category: upload.category,
      url: upload.url,
      size: upload.size,
      sizeFormatted: this.formatSize(upload.size),
      createdAt: upload.createdAt.toISO()!,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Private: Format File Size
  |--------------------------------------------------------------------------
  */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }
}

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/
export interface UploadResult {
  id: string
  userId: string
  originalName: string
  mimeType: string
  category: 'image' | 'file'
  url: string
  size: number
  sizeFormatted: string
  createdAt: string
}
