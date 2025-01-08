# ServiceNow React Boilerplate

A modern React boilerplate designed for building applications that integrate with ServiceNow. This project provides a solid foundation for developing React applications that can be hosted on ServiceNow, leveraging its API capabilities while maintaining a modern development workflow.

## Features

- React 19 with TypeScript support
- Webpack 5 for bundling
- ESLint and Prettier for code quality
- ServiceNow integration utilities
- React Router for client-side routing

## Development Prerequisites

- Node.js
- npm
- A ServiceNow instance for deployment

## Getting Started

1. Clone the repository
2. Navigate to sn-react-boilerplate folder and run ```npm install``` to install dependencies
3. Update configuration settings: ```servicenow.config.js```

## Running a Dev Copy
```npm run start``` will launch a local dev server using webpack

## Deploying to ServiceNow Instance
1. Install XML update set
2. ```npm run build``` will create ```./dist/``` containing ```index.html``` and your bundle files
2. Copy jelly code from ```./dist/index.html``` into a UI page
3. Attach (drag-and-drop) files from ```./dist/api/[...]``` folders to the corresponding GET resources
4. Open the UI page!