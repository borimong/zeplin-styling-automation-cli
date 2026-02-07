import { ZeplinApi, Configuration } from "@zeplin/sdk";

const ZEPLIN_TOKEN = process.env.ZEPLIN_TOKEN ?? "";

export const zeplinClient = new ZeplinApi(
  new Configuration({ accessToken: ZEPLIN_TOKEN }),
);
