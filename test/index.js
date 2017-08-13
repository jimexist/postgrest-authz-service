/* eslint-env mocha */
const request = require('supertest')
const chai = require('chai')
const assert = chai.assert

const req = request('http://localhost:3000')

describe('PostgREST APIs', () => {
  describe('Healthcheck', () => {
    it('should return 200 for /', done => {
      req.get('/').expect(200, done)
    })
  })

  describe('User Creation', () => {
    it('should allow user creation - CTO', done => {
      req.post('/users')
        .send({id: 1, title: 'CTO'})
        .expect(201, done)
    })

    it('should allow user creation - Frontend Team Lead', done => {
      req.post('/users')
        .send({id: 2, title: 'Frontend Team Lead', supervisor_id: 1})
        .expect(201, done)
    })

    it('should allow user creation - Backend Team Lead', done => {
      req.post('/users')
        .send({id: 3, title: 'Backend Team Lead', supervisor_id: 1})
        .expect(201, done)
    })

    it('should allow user creation - Frontend Developer', done => {
      req.post('/users')
        .send({id: 4, title: 'Frontend Developer', supervisor_id: 2})
        .expect(201, done)
    })

    it('should allow user creation - Backend Developer', done => {
      req.post('/users')
        .send({id: 5, title: 'Backend Developer', supervisor_id: 3})
        .expect(201, done)
    })

    it('should allow user creation - Frontend Developer 2', done => {
      req.post('/users')
        .send({id: 6, title: 'Frontend Developer 2', supervisor_id: 2})
        .expect(201, done)
    })
  })

  describe('Resource Creation', () => {
    it('should allow resource creation - Frontend Project', done => {
      req.post('/resources')
        .send({id: 1, name: 'Frontend Project', resource_type: 'project'})
        .expect(201, done)
    })

    it('should allow resource creation - Backend Project', done => {
      req.post('/resources')
        .send({id: 2, name: 'Backend Project', resource_type: 'project'})
        .expect(201, done)
    })
  })

  describe('ACL Creation', () => {
    it('should allow ACL creation - Frontend', done => {
      req.post('/access_lists')
        .send({user_id: 4, resource_id: 1, access_type: 'admin'})
        .expect(201, done)
    })

    it('should allow ACL creation - Backend', done => {
      req.post('/access_lists')
        .send({user_id: 3, resource_id: 2, access_type: 'admin'}) // the backend leader
        .expect(201, done)
    })
  })

  describe('ACL queries', () => {
    it('should allow admin access for frontend developer #4 on frontend project #1', done => {
      req.post('/rpc/check_acl')
        .send({user_id: 4, resource_id: 1})
        .expect(res => {
          assert.equal('admin', res.body)
        })
        .expect(200, done)
    })

    it('should disallow access for frontend developer #6 on frontend project #1', done => {
      req.post('/rpc/check_acl')
        .send({user_id: 6, resource_id: 1})
        .expect(res => {
          assert.equal(null, res.body)
        })
        .expect(200, done)
    })

    it('should allow admin access for frontend lead #2 on frontend project #1', done => {
      req.post('/rpc/check_acl')
        .send({user_id: 2, resource_id: 1})
        .expect(res => {
          assert.equal('admin', res.body)
        })
        .expect(200, done)
    })

    it('should allow admin access for CTO #1 on frontend project #1', done => {
      req.post('/rpc/check_acl')
        .send({user_id: 1, resource_id: 1})
        .expect(res => {
          assert.equal('admin', res.body)
        })
        .expect(200, done)
    })

    it('should disallow access for backend lead #3 on frontend project #1', done => {
      req.post('/rpc/check_acl')
        .send({user_id: 3, resource_id: 1})
        .expect(res => {
          assert.equal(null, res.body)
        })
        .expect(200, done)
    })
  })
})
