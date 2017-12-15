const isomorphicFetch = require('isomorphic-fetch')
const jwt = require('jsonwebtoken')
const jwkRsa = require('jwks-rsa')
const fromEvent = require('graphcool-lib').fromEvent

//Validates the request JWT token
const verifyToken = token =>
  new Promise(resolve => {
    //Decode the JWT Token
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new Error('Unable to retrieve key identifier from token')
    }
    if (decoded.header.alg !== 'RS256') {
      throw new Error(
        `Wrong signature algorithm, expected RS256, got ${decoded.header.alg}`
      )
    }
    const jkwsClient = jwkRsa({
      cache: true,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    })
    //Retrieve the JKWS's signing key using the decode token's key identifier (kid)
    jkwsClient.getSigningKey(decoded.header.kid, (err, key) => {
      if (err) throw new Error(err)
      const signingKey = key.publicKey || key.rsaPublicKey
      //If the JWT Token was valid, verify its validity against the JKWS's signing key
      jwt.verify(
        token,
        signingKey,
        {
          algorithms: ['RS256'],
          audience: process.env.AUTH0_API_IDENTIFIER,
          ignoreExpiration: false,
          issuer: `https://${process.env.AUTH0_DOMAIN}/`
        },
        (err, decoded) => {
          if (err) throw new Error(err)
          return resolve(decoded)
        }
      )
    })
  })

//Retrieves the Graphcool user record using the Auth0 user id
const getGraphcoolUser = (email, api) =>
  api
    .request(
      `
        query getUser($email: String!){
          User(email: $email){
            id
            email
          }
        }
      `,
      { email }
    )
    .then(queryResult => queryResult.User)

//Creates a new User record.
const createGraphCoolUser = (email, api) =>
  api
    .request(
      `
        mutation createUser($email: String!) {
          createUser(
            email: $email
          ){
            id
            email
          }
        }
      `,
      { email }
    )
    .then(queryResult => queryResult.createUser)

const fetchAuth0Email = accessToken =>
  fetch(
    `https://${process.env.AUTH0_DOMAIN}/userinfo?access_token=${accessToken}`
  )
    .then(response => response.json())
    .then(json => json.email)

export default async event => {
  try {
    if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_API_IDENTIFIER) {
      throw new Error(
        'Missing AUTH0_DOMAIN or AUTH0_API_IDENTIFIER environment variable'
      )
    }
    const { accessToken } = event.data

    const decodedToken = await verifyToken(accessToken)
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    // fetch email if scope includes it
    const email = await fetchAuth0Email(accessToken)
    let graphCoolUser = await getGraphcoolUser(email, api)
    //If the user doesn't exist, a new record is created.
    if (graphCoolUser === null) {
      graphCoolUser = await createGraphCoolUser(email, api)
    }

    // custom exp does not work yet, see https://github.com/graphcool/graphcool-lib/issues/19
    const token = await graphcool.generateNodeToken(
      graphCoolUser.id,
      'User',
      decodedToken.exp
    )

    return { data: { id: graphCoolUser.id, token, email: graphCoolUser.email } }
  } catch (err) {
    console.log(err)
    return { error: 'An unexpected error occured' }
  }
}