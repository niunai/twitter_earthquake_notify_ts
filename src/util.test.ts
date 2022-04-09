import "dotenv/config";
import { makeNotifyMsg, pushCount, getDateString } from "./util";

describe("makeNotifyMsg", () => {
  test("yurekuru, 震度3", () => {
    const username = "yurekuru";
    const text =
      "[EEW] ID：ND20211219064135 SEQ：final 震源地：静岡県中部 緯度：35.0 経度：138.4 震源深さ：10km 発生日時：2021/12/19 06:41:31 マグニチュード：3.4 最大震度：３ #yurekuru";
    expect(makeNotifyMsg(username, text)).toStrictEqual([
      "地震です。震度3、静岡県中部",
      3,
    ]);
  });

  test("yurekuru, 震度2", () => {
    const username = "yurekuru";
    const text =
      "[EEW] ID：ND20211217144000 SEQ：1 震源地：福島県沖 緯度：37.7 経度：141.6 震源深さ：80km 発生日時：2021/12/17 14:39:48 マグニチュード：3.5 最大震度：２ #yurekuru";
    expect(makeNotifyMsg(username, text)).toStrictEqual(["", 2]);
  });

  test("yurekuru, 震度不明", () => {
    const username = "yurekuru";
    const text =
      "[EEW] ID：ND20211212122202 SEQ：1 震源地：北海道北西沖 緯度：44.5 経度：141.1 震源深さ：330km 発生日時：2021/12/12 12:21:20 マグニチュード：4.8 最大震度：不明 #yurekuru";
    expect(makeNotifyMsg(username, text)).toStrictEqual(["", 0]);
  });

  test("yurekuru, others", () => {
    const username = "yurekuru";
    const text = "dummy_text";
    expect(makeNotifyMsg(username, text)).toStrictEqual(["", 0]);
  });

  test("earthquake_jp, 震度3", () => {
    const username = "earthquake_jp";
    const text =
      "【気象庁情報】12日　12時31分頃　茨城県南部（N36.1/E139.9）にて　最大震度3（M5）の地震が発生。　震源の深さは50km。( https://j.mp/3lZcOYq ) #saigai #jishin #earthquake";
    expect(makeNotifyMsg(username, text)).toStrictEqual([
      "地震です。震度3、茨城県南部",
      3,
    ]);
  });

  test("earthquake_jp, 震度2", () => {
    const username = "earthquake_jp";
    const text =
      "［気象庁情報］12日　18時42分頃　宮城県沖（N38.6/E142.2）にて　最大震度2（M4）の地震が発生。　震源の深さは40km。( https://j.mp/3pS1tdA ) #saigai #jishin #earthquake";
    expect(makeNotifyMsg(username, text)).toStrictEqual(["", 2]);
  });

  test("earthquake_jp, 速報", () => {
    const username = "earthquake_jp";
    const text =
      "［速報LV5］16日　03時01分頃　茨城県沖（N36.7/E141.6）(推定)にて　M3.8（推定）の地震が発生。　震源の深さは推定41km。#saigai #jishin #earthquake";
    expect(makeNotifyMsg(username, text)).toStrictEqual(["", 0]);
  });

  test("earthquake_jp, others", () => {
    const username = "earthquake_jp";
    const text = "dummy_text";
    expect(makeNotifyMsg(username, text)).toStrictEqual(["", 0]);
  });

  test("other username", () => {
    const username = "dummy_user";
    const text = "dummy_text";
    expect(makeNotifyMsg(username, text)).toStrictEqual(["", 0]);
  });
});

describe("pushCount", () => {
  test("push yurekuru 1", async () => {
    const status = await pushCount(
      process.env.PUSH_GATEWAY_API_ENDPOINT_URL ?? "",
      process.env.PUSH_GATEWAY_API_ENDPOINT_USER ?? "",
      process.env.PUSH_GATEWAY_API_ENDPOINT_PASSWORD ?? "",
      "twitter_earthquake_notifications",
      "yurekuru",
      "notifications_" + `1`,
      "Number of twitter earthquake notifications.",
      1
    );
    expect(status).toBe(200);
  });

  test("push earthquake_jp 1", async () => {
    const status = await pushCount(
      process.env.PUSH_GATEWAY_API_ENDPOINT_URL ?? "",
      process.env.PUSH_GATEWAY_API_ENDPOINT_USER ?? "",
      process.env.PUSH_GATEWAY_API_ENDPOINT_PASSWORD ?? "",
      "twitter_earthquake_notifications",
      "earthquake_jp",
      "notifications_" + `1`,
      "Number of twitter earthquake notifications.",
      1
    );
    expect(status).toBe(200);
  });

  test("push Event:DataKeepAlive", async () => {
    const status = await pushCount(
      process.env.PUSH_GATEWAY_API_ENDPOINT_URL ?? "",
      process.env.PUSH_GATEWAY_API_ENDPOINT_USER ?? "",
      process.env.PUSH_GATEWAY_API_ENDPOINT_PASSWORD ?? "",
      "twitter_earthquake_notifications",
      "twitter_event_data_keep_alive",
      "twitter_event_data_keep_alive",
      "Twitter Event:DataKeepAlive",
      1
    );
    expect(status).toBe(200);
  });

  test("push yurekuru 1, wrong url", async () => {
    const status = await pushCount(
      "http://www.google.com/",
      process.env.PUSH_GATEWAY_API_ENDPOINT_USER ?? "",
      process.env.PUSH_GATEWAY_API_ENDPOINT_PASSWORD ?? "",
      "twitter_earthquake_notifications",
      "yurekuru",
      "notifications_" + `1`,
      "Number of twitter earthquake notifications.",
      1
    );
    expect(status === 404 || status === 405).toBeTruthy();
  });

  test("push yurekuru 1, wrong password", async () => {
    const status = await pushCount(
      process.env.PUSH_GATEWAY_API_ENDPOINT_URL ?? "",
      process.env.PUSH_GATEWAY_API_ENDPOINT_USER ?? "",
      "xxxx",
      "twitter_earthquake_notifications",
      "yurekuru",
      "notifications_" + `1`,
      "Number of twitter earthquake notifications.",
      1
    );
    expect(status).toBe(401);
  });
});

describe("getDateString", () => {
  const expectedRegExp = new RegExp(
    String.raw`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}`
  );
  test("getDateString", () => {
    expect(getDateString()).toEqual(expect.stringMatching(expectedRegExp));
  });
});
