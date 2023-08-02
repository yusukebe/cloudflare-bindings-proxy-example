import { Hono } from 'hono'
import { binding } from 'cf-bindings-proxy'

type Env = {
  Bindings: {
    MY_KV: KVNamespace
  }
  Variables: {
    MY_KV: KVNamespace
  }
}

const noName = 'no name'

const app = new Hono<Env>()

app.use('*', async (c, next) => {
  const MY_KV = c.env ? c.env.MY_KV : binding<KVNamespace>('MY_KV')
  c.set('MY_KV', MY_KV)
  await next()
})

app.get('/', async (c) => {
  const namae = (await c.get('MY_KV').get('namae')) ?? noName

  const Page = () => (
    <html>
      <body>
        <h1>Wrangler + Vite</h1>
        <form action="/" method="post">
          <input type="text" name="namae" placeholder="name" />
          <input type="submit" />
        </form>
        <p>
          <b>{namae}</b>
        </p>
      </body>
    </html>
  )
  return c.html(<Page />)
})

app.post('/', async (c) => {
  const { namae } = await c.req.parseBody()
  if (typeof namae === 'string') {
    await c.get('MY_KV').put('namae', namae)
  }
  return c.redirect('/')
})

app.onError((e, c) => {
  return c.text(e.message)
})

export default app
