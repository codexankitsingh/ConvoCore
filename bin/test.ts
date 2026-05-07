import { createServer } from 'node:http'
import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@japa/runner'
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'

const APP_ROOT = new URL('../', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

processCLIArgs(process.argv.splice(2))

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .testRunner()
  .configure((app) => {
    configure({
      suites: [
        {
          name: 'unit',
          files: ['tests/unit/**/*.spec.{ts,js}'],
          timeout: 10000,
        },
        {
          name: 'integration',
          files: ['tests/integration/**/*.spec.{ts,js}'],
          timeout: 30000,
        },
      ],
      plugins: [
        assert(),
        apiClient(),
        pluginAdonisJS(app),
      ],
      reporters: {
        activated: ['spec'],
      },
      forceExit: true,
    })
  })
  .run(async (app) => {
    /*
    |------------------------------------------------------------------
    | DEBUG — verify app environment
    |------------------------------------------------------------------
    */
    console.log(`[ test ] app.inTest     = ${app.inTest}`)
    console.log(`[ test ] app.nodeEnv    = ${app.nodeEnvironment}`)
    console.log(`[ test ] app.env        = ${app.getEnvironment()}`)

    /*
    |------------------------------------------------------------------
    | Start HTTP server
    |------------------------------------------------------------------
    */
    const server = await app.container.make('server')
    await server.boot()

    const port = Number(process.env.PORT || 3334)
    const host = process.env.HOST || '0.0.0.0'

    const httpServer = createServer(server.handle.bind(server))
    server.setNodeServer(httpServer)

    await new Promise<void>((resolve, reject) => {
      httpServer.listen(port, host, () => {
        console.log(`[ test ] server started → http://${host}:${port}`)
        resolve()
      })
      httpServer.once('error', reject)
    })

    await run()

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve())
    })
  })
  .catch(prettyPrintError)
