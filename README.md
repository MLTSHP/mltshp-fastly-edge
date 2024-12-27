# MLTSHP Fastly Compute@Edge Service

## What this does

Right now, it is just for providing a dynamic response for our robots.txt file. This draws
some static content for the file from mltshp.com, and combines it with additional data from
darkvisitors.com (which tracks AI service user agents that we'd like to block).

## Making updates to our existing service

The Fastly CLI is required for publishing updates. Install that, and login to the account.

You'll also need to know the production service ID and active version number, both available via
our Fastly account.

The command to publish changes:

```shell
$ fastly compute publish --service-id=SERVICE_ID --version=ACTIVE_VERSION
```
