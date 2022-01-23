import "dotenv/config";
import { ETwitterStreamEvent, TwitterApi } from "twitter-api-v2";
import needle from "needle";
import playerImport from "play-sound";
import { makeNotifyMsg, pushCount, logInfo, logErr } from "./util";

const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN ?? "";
const GH_VOICETEXT_API_ENDPOINT_URL =
  process.env.GH_VOICETEXT_API_ENDPOINT_URL ?? "";
const BEEP_SOUND_FILE = process.env.BEEP_SOUND_FILE ?? "";
const PUSH_GATEWAY_API_ENDPOINT_URL =
  process.env.PUSH_GATEWAY_API_ENDPOINT_URL ?? "";
const PUSH_GATEWAY_API_ENDPOINT_USER =
  process.env.PUSH_GATEWAY_API_ENDPOINT_USER ?? "";
const PUSH_GATEWAY_API_ENDPOINT_PASSWORD =
  process.env.PUSH_GATEWAY_API_ENDPOINT_PASSWORD ?? "";

if (TWITTER_BEARER_TOKEN == "") {
  logErr('Error: "TWITTER_BEARER_TOKEN" is not set.');
  process.exit(1);
}

if (GH_VOICETEXT_API_ENDPOINT_URL == "") {
  logErr('Error: "GH_VOICETEXT_API_ENDPOINT_URL" is not set.');
  process.exit(1);
}

if (BEEP_SOUND_FILE == "") {
  logErr('Error: "BEEP_SOUND_FILE" is not set.');
  process.exit(1);
}

if (PUSH_GATEWAY_API_ENDPOINT_URL == "") {
  logErr('Error: "PUSH_GATEWAY_API_ENDPOINT_URL" is not set.');
  process.exit(1);
}

if (PUSH_GATEWAY_API_ENDPOINT_USER == "") {
  logErr('Error: "PUSH_GATEWAY_API_ENDPOINT_USER" is not set.');
  process.exit(1);
}

if (PUSH_GATEWAY_API_ENDPOINT_PASSWORD == "") {
  logErr('Error: "PUSH_GATEWAY_API_ENDPOINT_PASSWORD" is not set.');
  process.exit(1);
}

const player = playerImport({});

const twitterClient = new TwitterApi(TWITTER_BEARER_TOKEN);
const client = twitterClient.readOnly;

const gh_notify = (msg: string) => {
  const data = {
    text: msg,
  };

  needle("post", GH_VOICETEXT_API_ENDPOINT_URL, data).catch((err: unknown) => {
    logErr(err);
  });
};

const beep = () => {
  player.play(BEEP_SOUND_FILE, (err: unknown) => {
    if (err) logErr(err);
  });
};

const fetchData = async () => {
  interface StringKeyObject {
    [key: string]: number;
  }

  const count: StringKeyObject = { yurekuru: 0, earthquake_jp: 0 };

  const rules = await client.v2.streamRules();
  if (rules.data?.length) {
    await client.v2.updateStreamRules({
      delete: { ids: rules.data.map((rule: { id: string }) => rule.id) },
    });
  }

  await client.v2.updateStreamRules({
    add: [
      { value: "from:yurekuru", tag: "earthquake" },
      { value: "from:earthquake_jp", tag: "earthquake" },
    ],
  });

  const stream = await client.v2.searchStream({
    "user.fields": ["name"],
    expansions: ["author_id"],
  });
  stream.autoReconnect = true;

  logInfo(`Listen to the twitter stream...`);

  stream.on(
    ETwitterStreamEvent.Data,
    async (tweet: {
      includes: { users: { id: string; username: string }[] };
      data: { author_id: string; text: string };
    }) => {
      const username =
        tweet.includes.users.find((elm) => elm.id === tweet.data.author_id)
          ?.username ?? "";
      const text = tweet.data.text;
      console.log(username, text);

      const msg = makeNotifyMsg(username, text);
      if (msg) {
        gh_notify(msg);
        logInfo(`gh_notify: ${msg}`);
      } else {
        beep();
        logInfo(`beep`);
      }

      count[username]++;
      pushCount(
        PUSH_GATEWAY_API_ENDPOINT_URL,
        PUSH_GATEWAY_API_ENDPOINT_USER,
        PUSH_GATEWAY_API_ENDPOINT_PASSWORD,
        "twitter_earthquake_notifications",
        username,
        "notifications",
        "Number of twitter earthquake notifications.",
        count[username]
      ).catch((err: unknown) => {
        logErr(err);
      });
    }
  );

  stream.on(ETwitterStreamEvent.Error, async (error: { message: string }) => {
    logErr(`Twitter Event:Error: ${error.message}`);
  });
  stream.on(ETwitterStreamEvent.ReconnectAttempt, async () => {
    logErr(`Twitter Event:ReconnectAttempt`);
  });
  stream.on(ETwitterStreamEvent.Reconnected, async () => {
    logErr(`Twitter Event:Reconnected`);
  });
  // stream.on(ETwitterStreamEvent.DataKeepAlive, async () => {
  //   logErr(`Twitter Event:DataKeepAlive`);
  // });
  stream.on(ETwitterStreamEvent.Connected, async () => {
    logErr(`Connected to the Twitter stream`);
  });
};

fetchData();
