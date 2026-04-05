# Developer Platform Assignment

## Intro

This assignment is intended to evaluate your hands-on capabilities, give you a taste for the work we do, and show us how you communicate complex subjects in writing. You can refer to: Developer Platform, Cloudflare Docs and the Cloudflare Dashboard. The assignment is expected to be delivered in one week through the Greenhouse link provided.

Please keep in mind that, while we can help point you in the right direction, the objective is to evaluate your ability to learn new concepts quickly through effective research and self-discovery. The Cloudflare offering is vast, and it is crucial that you are comfortable researching answers on topics you may not be familiar with. This assignment is designed to be completed under free tier services.

We understand that AI tools are accessible, but we primarily want to see your unique approach to problem-solving within the Cloudflare ecosystem. If you do reference external tools, please be mindful not to rely on them blindly, as the core value of this assignment is in demonstrating your personal engineering judgment. During the panel presentation, we will look forward to discussing the specific challenges you encountered and the thought process behind your solutions, so having a deep, first-hand understanding of your work will be essential for a great conversation.

## Deliverables

- A working solution built using Cloudflare free tier services with instructions needed to access any of the following.
- A written report targeted to a customer with a mixed audience of technical experts and mid level leadership that addresses the following:
    - Describe the architecture, rationale and implementation steps followed to implement the technical requirements, including screenshots showing the configuration and testing evidence.
    - Instructions to use the solution and all of its features.
    - What are the relevant use cases the products are being used for?
    - How did you fill in the gaps (if any) in your knowledge during the process?
    - How do you imagine that a target customer will find this experience?
    - Feedback about the assignment.

## Pre-requisites

- Create a Cloudflare Free plan account or use an existing account.
- Install the Wrangler CLI for development and deployment.


## Building Blocks

### Origin Storage

Initialize a private R2 bucket and populate it with a small library of sample images.

### Edge Gateway

Create a Worker to serve these images to be rendered directly in a web browser. When a user requests an asset, the system must also provide a descriptive "Alt-Text" string for that image contained in a custom HTTP header.

- Create this Worker using the Wrangler CLI.
- Upload your Workers code to a public Git repository for your implementation.

### Automated Enrichment

Use Workers AI (Vision models) to generate the descriptive "Alt-Text" if one does not already exist.

- Be mindful of the daily ‘Neuron’ limits on Workers AI.
- The architecture must be efficient and avoid re-running inference on assets that have already been processed.

### Global Persistence

Configure a D1 Database to store these descriptions.

- The architecture should minimize redundant AI processing by referencing this persistent state.

### Performance Optimization

Implement a caching strategy using the Cloudflare Cache API.

- Ensure the system prioritizes the global edge cache to reduce latency and compute costs.
- Utilize non-blocking operations to handle background writes without delaying the image delivery.

### Administrative Visibility

Create a secure endpoint (e.g. /audit) that displays a JSON inventory of processed images and their metadata from D1.

### Dynamic Ingestion

Provide a way to ingest a new image into the R2 bucket via an external URL, automatically triggering the description and storage process.

### Security

Consider a secure environment at all times.