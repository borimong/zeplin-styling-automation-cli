import { ZeplinApi, Configuration } from "@zeplin/sdk";

export const zeplinClient = new ZeplinApi(
  new Configuration({ accessToken: "ACCESS_TOKEN" }),
);
