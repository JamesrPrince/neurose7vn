/**
 * Configure your Gatsby site with this file.
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

module.exports = {
  siteMetadata: {
    title: `TechFreelance Marketplace`,
    description: `A web-based platform for connecting developers and designers with clients for tech projects.`,
    author: `TechFreelance Team`,
    siteUrl: `https://techfreelance.example.com`,
  },
  plugins: [
    // Emotion for styling
    `gatsby-plugin-emotion`,
    
    // For document head management
    `gatsby-plugin-react-helmet`,
    
    // Image processing
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    
    // File system source for static assets
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    
    // File system source for static pages
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `pages`,
        path: `${__dirname}/src/pages`,
      },
    },
    
    // File system source for static content
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `content`,
        path: `${__dirname}/src/content`,
      },
    },
    
    // Enable TypeScript support
    {
      resolve: `gatsby-plugin-typescript`,
      options: {
        isTSX: true,
        jsxPragma: `jsx`,
        allExtensions: true,
      },
    },
  ],
}

