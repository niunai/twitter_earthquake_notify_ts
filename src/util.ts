import needle from "needle";

const toHalfWidth = (value: string) => {
  if (!value) return value;
  return String(value).replace(/[！-～]/g, function (all) {
    return String.fromCharCode(all.charCodeAt(0) - 0xfee0);
  });
};

export function makeNotifyMsg(
  username: string,
  text: string
): [string, number] {
  const MIN_SHINDO = 3;

  let out_text: string[];
  let ret = null;

  let shingenchi = "";
  let shindoText = "";
  let shindo = 0;

  switch (username) {
    case "yurekuru":
      out_text = text.split(/\x20/); // hankaku space
      shingenchi = out_text[3]?.split("：")[1] ?? "";
      shindoText = out_text[10]?.split("：")[1] ?? "";
      ret = toHalfWidth(shindoText).match(/(?<shindo>\d+)/);
      if (ret != null && ret.groups != null) {
        shindo = parseInt(ret.groups.shindo);
      }
      break;

    case "earthquake_jp":
      out_text = text.split(/\u3000/); // zenkaku space
      if (out_text[0].match(/速報/)) {
        return ["", shindo];
      }
      shingenchi = out_text[2]?.split("（")[0] ?? "";
      shindoText = out_text[3]?.split("（")[0] ?? "";
      ret = shindoText.match(/(?<shindo>\d+)/);
      if (ret != null && ret.groups != null) {
        shindo = parseInt(ret.groups.shindo);
      }
      break;

    default:
      return ["", shindo];
  }

  if (MIN_SHINDO <= shindo) {
    return [`地震です。震度${shindo}、${shingenchi}`, shindo];
  } else {
    return ["", shindo];
  }
}

export async function pushCount(
  url: string,
  username: string,
  password: string,
  jobName: string,
  instanceName: string,
  metricsName: string,
  metricsHelpText: string,
  metsicsCount: number
) {
  //
  const data = `
  # HELP ${metricsName} ${metricsHelpText}
  # TYPE ${metricsName} counter
  ${metricsName} ${metsicsCount}
  `;

  const options = {
    username,
    password,
  };

  const resp = await needle(
    "post",
    `${url}/job/${jobName}/instance/${instanceName}`,
    data,
    options
  );

  return resp.statusCode;
}

export function getDateString() {
  const z = (n: number) => ("0" + n).slice(-2);
  const d = new Date();

  return (
    d.getFullYear() +
    "-" +
    z(d.getMonth() + 1) +
    "-" +
    z(d.getDate()) +
    "T" +
    z(d.getHours()) +
    ":" +
    z(d.getMinutes()) +
    ":" +
    z(d.getSeconds())
  );
}

export function logErr(msg: string | unknown) {
  console.error(`${getDateString()}: ${msg}`);
}

export function logInfo(msg: string) {
  console.log(`${getDateString()}: ${msg}`);
}
