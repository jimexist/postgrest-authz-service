/* eslint-env mocha */
const request = require('supertest')

const req = request('http://localhost:3000')

describe('postgrest API', () => {
  it('should return 200 for /', done => {
    req.get('/').expect(200, done)
  })
})
