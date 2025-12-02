import { App, staticFiles } from "fresh";
import { db, define, User, type State } from "./utils.ts";
import {
  oauth2Authorize,
  OAuth2ClientConfig,
  oauth2ExchangeCode,
} from "@maks11060/oauth2";
import { getCookies, setCookie } from "jsr:@std/http@^1.0.7/cookie";

export const app = new App<State>();

// Authentication setup
const oauth2Client: OAuth2ClientConfig = {
  clientId: Deno.env.get("oauth2_clientId")!,
  clientSecret: Deno.env.get("oauth2_clientSecret")!,
  authorizeUri: "https://dev-rv2b6ksuxugirdcl.eu.auth0.com/authorize",
  tokenUri: "https://dev-rv2b6ksuxugirdcl.eu.auth0.com/oauth/token",
  redirectUri: "http://127.0.0.1:5173/auth/callback",
  scope: "openid profile email",
};

app.get("/auth/login", (_ctx) => {
  const state = crypto.randomUUID();
  const uri = oauth2Authorize(oauth2Client, state);
  return Response.redirect(uri.toString());
});

app.get("/auth/callback", async (ctx) => {
  const { origin, searchParams } = new URL(ctx.req.url);

  const code = searchParams.get("code");
  if (!code) {
    return new Response(undefined, { status: 404 });
  }

  const accessToken = await oauth2ExchangeCode(oauth2Client, { code });

  const response = new Response(undefined, {
    status: 302,
    headers: { "location": origin },
  });

  setCookie(response.headers, {
    path: "/",
    name: "auth_token",
    value: accessToken.access_token,
    maxAge: 60 * 60 * 12, // 12 hours
  });

  return response;
});

app.get("/auth/logout", (ctx) => {
  const { origin } = new URL(ctx.req.url);
  const response = new Response(undefined, {
    status: 302,
    headers: { "location": origin },
  });

  setCookie(response.headers, {
    path: "/",
    name: "auth_token",
    value: "",
  });

  return response;
});

app.use(define.middleware(async (ctx) => {
  
  const includePaths = ["/", "/api/counter/increment" , "/api/counter/decrement"];
  const excludedPaths = ["/auth/login", "/auth/callback", "/auth/logout", "/sse/counter"];
  if (excludedPaths.some((path) => ctx.req.url.endsWith(path))) {
    return ctx.next();
  }
  if (!includePaths.some((path) => ctx.req.url.endsWith(path))) {
    console.log("Skipping auth for path please add to includePaths or excludedPaths" + ctx.req.url);
    return ctx.next();
  }

console.log("Authenticating request for " + ctx.req.url);

  
  const token = getCookies(ctx.req.headers)["auth_token"];
  if (token) {
    const userInfo = await fetch(
      "https://dev-rv2b6ksuxugirdcl.eu.auth0.com/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    
    if (!userInfo.ok) {
      console.log("User info request failed");
      console.log(userInfo.statusText);
      return Response.redirect("/auth/logout");
    }

    const userData = await userInfo.json();

    const userOptional = await db.get<User>(["counter", "log", userData.sub]);
    
    if (userOptional.value) {
      ctx.state.user = userOptional.value;
    } else {
      // deno-lint-ignore no-explicit-any
      ctx.state.user = userData as any as User;
    }
  }

  return ctx.next();
}));

// Static files
app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();
