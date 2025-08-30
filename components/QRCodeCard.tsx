"use client";

import { Card, CardContent } from "@/components/ui/card";
import QRCode from "react-qr-code";

export default function QRCodeCard({ url }: { url: string }) {
  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center gap-2">
        <QRCode value={url} size={160} />
        <small className="text-muted-foreground break-all text-center">{url}</small>
      </CardContent>
    </Card>
  );
}
