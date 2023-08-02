import type http from 'http'
import type { Plugin, ViteDevServer, Connect } from 'vite'
import { getRequestListener } from '@hono/node-server'

export type DevServerOptions = {
  entry: string
  client?: string
  passThrough?: string[]
}

export function devServer(options: DevServerOptions): Plugin[] {
  const plugins: Plugin[] = [
    {
      name: 'dev-server',
      configureServer: async (server) => {
        async function createMiddleware(server: ViteDevServer): Promise<Connect.HandleFunction> {
          return async function (
            req: http.IncomingMessage,
            res: http.ServerResponse,
            next: Connect.NextFunction
          ): Promise<void> {
            let passThough = false

            if (options?.passThrough && req.url) {
              if (options.passThrough.includes(req.url)) {
                passThough = true
              }
            }

            if (
              passThough === false &&
              (req.url?.endsWith('.ts') ||
                req.url?.startsWith('/@vite/client') ||
                req.url?.startsWith('/@fs/') ||
                req.url?.startsWith('/node_modules'))
            ) {
              return next()
            }

            const appModule = await server.ssrLoadModule(options.entry)
            const app = appModule['default']

            if (!app) {
              console.error(`Failed to find a named export "default" from ${options.entry}`)
            } else {
              getRequestListener(async (request) => {
                if (passThough) {
                  return new Response(null)
                }

                const response = await app.fetch(request)
                if (response.headers.get('content-type')?.match(/^text\/html/)) {
                  let body = (await response.text()) + '<script type="module" src="/@vite/client"></script>'
                  const headers = new Headers(response.headers)
                  headers.delete('content-length')
                  return new Response(body, {
                    status: response.status,
                    headers
                  })
                }
                return response
              })(req, res)
            }
          }
        }

        server.middlewares.use(await createMiddleware(server))
      }
    }
  ]
  return plugins
}

export default devServer
