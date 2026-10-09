# Staging Basic Auth

The application deploy writes `/var/www/landing_page/.htpasswd-staging` from these
server-only `.env.stg` values:

```ini
DEPLOY_ENV=staging
NEXT_PUBLIC_SERVER_URL=https://stg.nb1.com
STG_BASIC_AUTH_USERNAME=nb1-staging
STG_BASIC_AUTH_PASSWORD='choose-a-shared-password'
```

Production must also declare its matching deployment identity in `.env.prod`:

```ini
DEPLOY_ENV=production
NEXT_PUBLIC_SERVER_URL=https://nb1.com
```

Both deploy scripts reject mismatched environment/hostname pairs before installing
dependencies, copying the active `.env`, running migrations, or stopping the app.
Production is crawlable and advertises its root sitemap; only staging receives
`Disallow: /` and the additional global noindex response header. The deployment
crawl checks the final public `robots.txt` and `X-Robots-Tag` response so an Nginx
or Cloudflare override cannot silently apply staging containment to production.

Nginx needs one manual, one-time configuration because the active virtual-host file
is owned by the server rather than this repository. Complete this before merging so
staging is never briefly exposed between the deploy and the edge check:

1. Create `/var/www/landing_page/.htpasswd-staging` from the same `.env.stg`
   username and password. `deploy-stg.sh` will regenerate it atomically on later
   deployments:

   ```sh
   cd /var/www/landing_page
   set -o allexport
   source .env.stg
   set +o allexport
   BASIC_AUTH_HASH="$(printf '%s\n' "$STG_BASIC_AUTH_PASSWORD" | openssl passwd -apr1 -stdin)"
   printf '%s:%s\n' "$STG_BASIC_AUTH_USERNAME" "$BASIC_AUTH_HASH" >.htpasswd-staging
   chmod 0644 .htpasswd-staging
   unset BASIC_AUTH_HASH STG_BASIC_AUTH_PASSWORD
   ```

2. Add the following directives inside the HTTPS `server` block for `stg.nb1.com`
   (the checked-in include becomes the maintainable equivalent after deployment):

   ```nginx
   auth_basic "NB1 Staging";
   auth_basic_user_file /var/www/landing_page/.htpasswd-staging;
   ```

3. Validate and reload nginx:

   ```sh
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Add the same plaintext username and password as GitHub Actions secrets named
   `STG_BASIC_AUTH_USERNAME` and `STG_BASIC_AUTH_PASSWORD`.
5. Purge the `stg.nb1.com` Cloudflare cache so no response cached before nginx auth
   can be served anonymously.

The staging workflow then verifies the public Cloudflare-to-nginx path after every
deploy. Anonymous frontend, CMS, API, robots, and sitemap requests must return a
Basic Auth challenge before the workflow passes, including a known deep page that
could otherwise remain in an edge cache.

After the first successful deployment, the two inline nginx directives can be
replaced with:

```nginx
include /var/www/landing_page/ops/nginx/staging-basic-auth.conf;
```

## MCP endpoint exemption

`/cms/api/mcp` is exempt from Basic Auth. MCP clients send their key as
`Authorization: Bearer …`, and a request carries one Authorization header, so
behind Basic Auth no MCP client can reach staging at all. The endpoint stays
closed: Payload rejects requests without an enabled, unexpired MCP key, and the
staging workflow asserts that an anonymous request gets Payload's 401 rather
than a Basic Auth challenge.

The exemption is in `staging-basic-auth.conf`. If the server block still has the
two inline directives from step 2, replace them with the include (or paste the
file's contents), then:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

Apply this before merging the change that adds the MCP assertion to
`scripts/check-staging-containment.mjs`, or the post-deploy check fails.

