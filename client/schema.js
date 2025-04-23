const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Product {
    id: ID!
    name: String!
    price: Float!
    description: String
    categories: [String!]!
    createdAt: String
    updatedAt: String
  }

  input ProductInput {
    name: String!
    price: Float!
    description: String
    categories: [String!]!
  }

  type Query {
    products: [Product!]!
    product(id: ID!): Product
    productsByCategory(category: String!): [Product!]!
  }

  type Mutation {
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }
`);

module.exports = schema; 