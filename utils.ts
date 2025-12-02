import { createDefine } from "fresh";
import type { Session } from "@5t111111/fresh-session";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes.
export interface User {
  sub: string;
  name: string;
  nickname: string;
  picture: string;
  email: string;
  beersChugged?: number; 
}

export interface State {
  user: User;
}

export const define = createDefine<State>();

export const db = await Deno.openKv();
