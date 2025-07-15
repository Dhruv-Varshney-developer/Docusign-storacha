// src/app/api/fetch-ipns-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
    try {
        const url = req.nextUrl.searchParams.get("url");
        if (!url) {
            return NextResponse.json({ error: "Missing 'url' query param" }, { status: 400 });
        }

        const parsed = new URL(url);

        const isValidIPNS = (
            parsed.hostname.includes(".ipns.dweb.link") ||
            parsed.hostname === "w3s.link" ||
            
            parsed.pathname.startsWith("/ipns/")
        );
        const isValidPDF = parsed.pathname.endsWith(".pdf");

        if (!isValidIPNS || !isValidPDF) {
            return NextResponse.json({ error: "Invalid IPNS or file URL" }, { status: 400 });
        }

        const fetchRes = await fetch(url);

        if (!fetchRes.ok) {
            return NextResponse.json(
                { error: `Failed to fetch IPNS PDF: ${fetchRes.status}` },
                { status: fetchRes.status }
            );
        }

        const buffer = await fetchRes.arrayBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${parsed.pathname.split("/").pop()}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err: any) {
        console.error("Error fetching IPNS PDF:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
