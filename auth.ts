import { db, User } from "./utils.ts";
import {
  oauth2Authorize,
  OAuth2ClientConfig,
  oauth2ExchangeCode,
} from "@maks11060/oauth2";
import { getCookies, setCookie } from "jsr:@std/http@^1.0.7/cookie";
import { App, Context, createDefine } from "fresh";

export interface User {
  sub: string;
  name: string;
  nickname: string;
  picture: string;
  email: string;
  beersChugged?: number;
}


export class AuthApp<T> extends App<T> {
  constructor(oauth2ClientConfig: OAuth2ClientConfig) {
    super();

    this.get("/auth/login", (_ctx) => {
      const state = crypto.randomUUID();
      const uri = oauth2Authorize(oauth2ClientConfig, state);
      return Response.redirect(uri.toString());
    });

    this.get("/auth/callback", async (ctx) => {
      const { origin, searchParams } = new URL(ctx.req.url);

      const code = searchParams.get("code");
      if (!code) {
        return new Response(undefined, { status: 404 });
      }

      const accessToken = await oauth2ExchangeCode(oauth2ClientConfig, {
        code,
      });

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

    this.get("/auth/logout", (ctx) => {
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

    this.use(createDefine<T>().middleware(async (ctx: Context<T>) => {
      const includePaths = [
        "/",
        "/api/counter/increment",
        "/api/counter/decrement",
      ];
      const excludedPaths = [
        "/auth/login",
        "/auth/callback",
        "/auth/logout",
        "/sse/counter",
      ];
      if (excludedPaths.some((path) => ctx.req.url.endsWith(path))) {
        return ctx.next();
      }
      if (!includePaths.some((path) => ctx.req.url.endsWith(path))) {
        console.log(
          "Skipping auth for path please add to includePaths or excludedPaths" +
            ctx.req.url,
        );
        return ctx.next();
      }

      console.log("Authenticating request for " + ctx.req.url);

      const token = getCookies(ctx.req.headers)["auth_token"];
      if (!token) {
        const { origin } = new URL(ctx.req.url);
        return new Response(undefined, {
          status: 302,
          headers: { "location": origin + "/auth/login" },
        });
      }
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
        const { origin } = new URL(ctx.req.url);
        return new Response(undefined, {
          status: 302,
          headers: { "location": origin + "/auth/login" },
        });
      }

      const userData = await userInfo.json();

      const userOptional = await db.get<User>(["counter", "log", userData.sub]);

      if (userOptional.value) {
        ctx.state.user = userOptional.value;
      } else {
        // deno-lint-ignore no-explicit-any
        ctx.state.user = userData as any as User;
      }

      return ctx.next();
    }));
  }
}
