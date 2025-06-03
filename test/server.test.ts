import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import express from 'express'
import supertest from 'supertest'

import { connect, getDb } from '../server/mongo'
import { registerRoutes } from '../server/routes'

let request: supertest.SuperTest<supertest.Test>
let mongo: MongoMemoryServer

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  process.env.MONGO_URI = mongo.getUri()
  await connect()

  const app = express()
  app.use(express.json())
  await registerRoutes(app)
  request = supertest(app)
})

afterAll(async () => {
  await getDb().dropDatabase()
  await mongo.stop()
})

beforeEach(async () => {
  await getDb().dropDatabase()
})

describe('Grocery lists API', () => {
  it('creates and lists grocery lists', async () => {
    const create = await request.post('/api/lists').send({ name: 'Test List' })
    expect(create.status).toBe(201)
    const listId = create.body._id

    const get = await request.get('/api/lists')
    expect(get.status).toBe(200)
    expect(get.body).toEqual([{ _id: listId, name: 'Test List', shareId: expect.any(String) }])
  })

  it('adds items and marks purchased', async () => {
    const listRes = await request.post('/api/lists').send({ name: 'Groceries' })
    const listId = listRes.body._id
    const itemRes = await request
      .post(`/api/lists/${listId}/items`)
      .send({ name: 'Milk', quantity: 2 })
    const itemId = itemRes.body._id

    const patch = await request
      .patch(`/api/items/${itemId}/purchased`)
      .send({ purchased: true })
    expect(patch.status).toBe(200)
    expect(patch.body.groceryItem.purchased).toBe(true)
    expect(patch.body.inventoryItem.name).toBe('Milk')

    const inv = await request.get('/api/inventory')
    expect(inv.status).toBe(200)
    expect(inv.body).toEqual([
      { _id: patch.body.inventoryItem._id, name: 'Milk', quantity: 2, category: null, lowStockThreshold: 1 }
    ])
  })
})
