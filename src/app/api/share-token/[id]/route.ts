import { NextResponse } from "next/server";
import { verifyApiRequest } from "@/lib/auth";
import { createHmac } from "crypto";

/**
 * Returns an HMAC share token for a given invoice ID.
 * This endpoint IS authenticated — only the logged-in admin can request tokens.
 * The token is then included in WhatsApp share links so customers can
 * download the PDF without logging in.
 */

function generateShareToken(invoiceId: number): string {
  const secret = process.env.JWT_SECRET || "fallback";
  return createHmac("sha256", secret)
    .update(`share-invoice-${invoiceId}`)
    .digest("hex")
    .substring(0, 16);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthed = await verifyApiRequest(request);
  if (!isAuthed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  const token = generateShareToken(id);
  return NextResponse.json({ token });
}
