# PostgREST Authz Service

[![Build Status](https://travis-ci.org/Jimexist/postgrest-authz-service.svg?branch=master)](https://travis-ci.org/Jimexist/postgrest-authz-service)

Using postgrest as an authorization service.

## Motivation

Authorization is a very domain-dependent topic, and thus it is harder to
standardize (than e.g. Authn, where solutions like OAuth2 exist) IMO. Given a
more specific context, however, it is rather straightforward to build a
*service* that can be used within an internal environment.

This project introduces a solution that is to be used internally as a RESTful
service and queried by other internal (micro-)services. It allows other services
to store, manage, and query authorization models like users, resources, and
access lists (ACLs). Since most of these operations are purely CRUDs, there is
no point of writing repetitive HTTP routes, JSON handling logics, or model
mapping logics from/to backend database - the right tool is to use
[PostgREST](https://postgrest.com) and allow your Postgres skills to do the rest.

Given that, you can build an authz service with just your SQL model, and no
other coding required. It is also flexible enough so that you can change your
schema, logic, etc. within minimal time.

**TLDR;** all you need is to write the `create-model.sql`, and then you'll
get an up-and-running authorization service within a minute!

## Authz model

In this example, I used a very simple model:

- there are users (and their supervisors, if present)
- there are resources (and their type as an enum)
- there are access lists that record who can access what, with what role
- for any user, he/she automatically gets the access list of all his/her
  subordinates, i.e. if you can access a resource, so does your boss, and his
  boss, etc.

Notice that resources do not have this type of hierarchy, but as mentioned above,
you can easily adjust it to your needs.

### Postgres CTE

If you wonder how the recursive ACL checking is done, there is a very powerful
language struct in Postgres called [recursive common table expressions](https://www.postgresql.org/docs/current/static/queries-with.html),
with which you can do recursive queries and union their results together.

This can save you a lot of coding (when done in non-pg languages e.g. Java or
Go), and also a lot of roundtrip queries. With proper index setup, this can also
be quite fast. Below is the query plan for the recursive CTE used in this example:

```
Nested Loop  (cost=273.90..293.68 rows=17 width=4)
  CTE all_subordinates
    ->  Recursive Union  (cost=0.15..259.31 rows=481 width=4)
          ->  Index Only Scan using users_pkey on users  (cost=0.15..8.17 rows=1 width=4)
                Index Cond: (id = 1)
          ->  Hash Join  (cost=0.33..24.15 rows=48 width=4)
                Hash Cond: (u_1.supervisor_id = c.id)
                ->  Seq Scan on users u_1  (cost=0.00..19.70 rows=970 width=8)
                ->  Hash  (cost=0.20..0.20 rows=10 width=4)
                      ->  WorkTable Scan on all_subordinates c  (cost=0.00..0.20 rows=10 width=4)
  ->  Index Only Scan using resources_pkey on resources r  (cost=0.15..8.17 rows=1 width=4)
        Index Cond: (id = 2)
  ->  Hash Join  (cost=14.44..26.03 rows=17 width=8)
        Hash Cond: (u.id = a.user_id)
        ->  CTE Scan on all_subordinates u  (cost=0.00..9.62 rows=481 width=4)
        ->  Hash  (cost=14.35..14.35 rows=7 width=12)
              ->  Bitmap Heap Scan on access_lists a  (cost=4.21..14.35 rows=7 width=12)
                    Recheck Cond: (resource_id = 2)
                    ->  Bitmap Index Scan on resource_id_idx  (cost=0.00..4.21 rows=7 width=0)
                          Index Cond: (resource_id = 2)
```

## Test as a demo

You can checkout [`test/index.js`](https://github.com/Jimexist/postgrest-authz-service/blob/master/test/index.js) as a demo for how the APIs will look like. It
is written in Node.js and if you want to run it yourself, make sure you do the
following to setup environment first.

![Test Screenshot](https://github.com/Jimexist/postgrest-authz-service/raw/master/screenshots/mocha_test.png)

### Environment setup

1. install docker and docker-compose
2. install Node.js and [yarn](https://yarnpkg.com/)
3. make sure your local `3000` and `8080` ports aren't taken, otherwise change
   `docker-compose.yml`
4. run `docker-compose up` and wait for *connection successful* log, so that you
   know `PostgREST` has successfully connected to the database
5. run `yarn` to install dependencies for tests
6. run `yarn test` to run the tests

If you run the tests again you will see some errors, because the model ids
conflict. This is the expected behavior, and you can free to change tests and
apply some deletion logic as well.

## Swagger and Open API

As mentioned in the docs of `PostgREST` you can also use swagger to see the API
documentation. If you run the `docker-compose` a swagger UI server is already
available at `http://localhost:8080`, make sure you change the docs address to
`http://localhost:3000` in order to see the `PostgREST` exposed APIs.

![Swagger API Screenshot](https://github.com/Jimexist/postgrest-authz-service/raw/master/screenshots/swagger_api.png)

![Swagger API Screenshot - RPC](https://github.com/Jimexist/postgrest-authz-service/raw/master/screenshots/swagger_api_rpc.png)
