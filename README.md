# MCP Server for New Relic Change Tracking

An MCP server that integrates with New Relic Change Tracking via chat interfaces.

## Overview

This tool is a server that makes it easy to record and integrate New Relic Change Tracking events through chat-based interfaces.
It uses the Model Context Protocol (MCP) to support direct requests from LLMs, making it simple to record application deployment events and other changes.

Note: This repository was created as a practice implementation of an MCP server and is not recommended for production use.

## Tools

### `newrelic_change_tracking_create_deployment`

- Records deployments for the specified entity

#### inputs

| Field | Type | Required | Description                                                                    |
|-------|------|----------|--------------------------------------------------------------------------------|
| `version` | string | Yes | Version of the deployment                                                      |
| `name` | string | Yes | Entity Name of the deployment                                                  |
| `domainType` | string | No | Domain Type                                                                    |
| `entityGuid` | string | No | Entity GUID - defaults to mapped value or environment variable if not provided |
| `description` | string | No | Description of the deployment                                                  |
| `user` | string | No | User who initiated the deployment                                              |
| `commit` | string | No | Commit hash or identifier                                                      |
| `changelog` | string | No | Changelog details                                                              |
| `timestamp` | number \| string | No | Timestamp - defaults to current time                                           |


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


```text
Record a deployment for application <application name> with version <version>
```

Example:
```text
Record a deployment for application my-application with version 1.0.0
```

#### Optional Parameters

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
