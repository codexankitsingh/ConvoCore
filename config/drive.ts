import { defineConfig, services } from '@adonisjs/drive'

/*
|--------------------------------------------------------------------------
| Drive Configuration
|--------------------------------------------------------------------------
|
| AdonisJS Drive provides a unified API for file storage.
| Using local disk for now — easily swappable to S3/GCS later.
|
*/
const driveConfig = defineConfig({
  default: 'local',

  services: {
    local: services.fs({
      location: new URL('../storage/uploads', import.meta.url),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
