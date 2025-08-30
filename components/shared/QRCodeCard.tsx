"use client";

import { Card, CardContent } from "@/components/ui/card";
import QRCode from "qrcode.react";

interface QRCodeCardProps {
  url: string;
  title?: string;
}

export function QRCodeCard({ url, title = "Scan to view poll" }: QRCodeCardProps) {
  return (
    <Card>
      <CardContent className="p-6 flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg">
          <QRCode 
            value={url} 
            size={160}
            level="M"
            includeMargin={true}
          />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground break-all max-w-xs">
            {url}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
