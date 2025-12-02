import { staticFiles } from "fresh";
import { type State } from "./utils.ts";
import { AuthApp } from "./auth.ts";

export const app = new AuthApp<State>({
  clientId: Deno.env.get("oauth2_clientId")!,
  clientSecret: Deno.env.get("oauth2_clientSecret")!,
  authorizeUri: "https://dev-rv2b6ksuxugirdcl.eu.auth0.com/authorize",
  tokenUri: "https://dev-rv2b6ksuxugirdcl.eu.auth0.com/oauth/token",
  redirectUri: Deno.env.get("DENO_DEPLOYMENT_ID")
    ? "https://iccee0-bier-counter-20.deno.dev/auth/callback"
    : "http://127.0.0.1:5173/auth/callback",
  scope: "openid profile email",
});

// Static files
app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();
