# MCP Server for New Relic Change Tracking

An MCP server that integrates with New Relic Change Tracking via chat interfaces.

## Overview

This tool is a server that makes it easy to record and integrate New Relic Change Tracking events through chat-based interfaces.
It uses the Model Context Protocol (MCP) to support direct requests from LLMs, making it simple to record application deployment events and other changes.

Note: This repository was created as a practice implementation of an MCP server and is not recommended for production use.

## Setup

### Docker Build

```shell
# Build the image
docker build -t newrelic-change-tracking-mcp-server .
```

## Usage

### Required Environment Variables

- `NEW_RELIC_API_KEY` - Specify your New Relic API key ([USER KEY](https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/#user-key)).

For Claude Desktop MCP users, you can configure `claude_desktop_config.json` as follows:

### Docker

```json
{
  "mcpServers": {
    "newrelic-change-tracking": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "NEW_RELIC_API_KEY",
        "newrelic-change-tracking-mcp-server"
      ],
      "env": {
        "NEW_RELIC_API_KEY": "Set New Relic User Key"
      }
    }
  }
}
```

### How to Use

Enter a prompt to record application changes:

#### Required Parameters

The following parameters are required:

- `Application name`: The name of the application for which to record changes
- `version`: The version being deployed

```text
Record a deployment for application <application name> with version <version>
```

Example:
```text
Record a deployment for application my-application with version 1.0.0
```

#### Optional Parameters

The following parameters are optional:

- `user`: The username of the person executing the deployment (default: "system")
- `description`: A description of the deployment
- `changelog`: Detailed information about the changes
- `repository`: Repository URL
- `commit`: Commit hash
- `domainType`: Entity domain type (e.g., "APM-APPLICATION", "BROWSER-APPLICATION", "MOBILE-APPLICATION")

```text
Record a deployment for application <application name> with version <version>
user: <username>
description: <description>
changelog: <changelog>
repository: <repository URL>
commit: <commit hash>
domainType: <domain type>
```

Example:
```text
Record a deployment for application my-application with version 1.0.0
user: yuzujoe
description: Spring release update
changelog: - Fixed login bug\n- Added new dashboard feature
repository: repository URL
commit: commit hash
domainType: APM-APPLICATION
```
