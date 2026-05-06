import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const result: Record<string, unknown> = { step: "start" };
  try {
    result.step = "import-lib";
    const lib = await import("./_lib");
    result.libKeys = Object.keys(lib);
    result.step = "import-success";
  } catch (e) {
    result.error = (e as Error).message;
    result.stack = (e as Error).stack?.split("\n").slice(0, 8);
  }
  return res.status(200).json(result);
}
