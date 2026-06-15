# Mozilla AMO Reviewer Notes: MongoLens

Thank you for reviewing MongoLens!

## Environment Requirements
To build this extension from source, you will need:
- **Operating System**: Windows, macOS, or Linux
- **Node.js**: 18.0.0 or later
- **npm**: 9.0.0 or later

## Build Instructions
This project does not require any external services, remote fetching, or proprietary tools to build. Everything is bundled locally using Vite.

1. **Extract the Source ZIP**
   Unzip the provided source code archive to a local directory.

2. **Install Dependencies**
   Run the following command in the root directory to install all required dependencies:
   ```bash
   npm install
   ```

3. **Build the Extension**
   Run the build script:
   ```bash
   npm run build
   ```

4. **Locate the Output**
   The production-ready extension files will be generated in the `dist/` directory. You can load this directory directly into your browser as an unpacked extension to verify it perfectly matches the submitted XPI/ZIP.

## Technical Details
- The project is built using React, React Flow, and Vite.
- All parsing of schemas happens 100% locally in the browser using `@babel/parser`.
- There is no telemetry, no remote scripts, and no data collection of any kind.

Please let me know if you need any further clarification. Thank you!
