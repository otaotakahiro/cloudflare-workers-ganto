import { onRequestPost as __api_auth_login_ts_onRequestPost } from "/Users/takahiro_otao/Repositories/otaotakahiro/cloudflare-workers-ganto/functions/api/auth/login.ts"
import { onRequestPost as __api_auth_register_ts_onRequestPost } from "/Users/takahiro_otao/Repositories/otaotakahiro/cloudflare-workers-ganto/functions/api/auth/register.ts"
import { onRequest as __api___path___ts_onRequest } from "/Users/takahiro_otao/Repositories/otaotakahiro/cloudflare-workers-ganto/functions/api/[[path]].ts"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_ts_onRequestPost],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___ts_onRequest],
    },
  ]