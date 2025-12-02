import { createDefine } from "fresh";
import { User } from "./auth.ts";
export interface State {
  user: User;
}

export const define = createDefine<State>();

export const db = await Deno.openKv();
