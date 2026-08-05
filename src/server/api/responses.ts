import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
