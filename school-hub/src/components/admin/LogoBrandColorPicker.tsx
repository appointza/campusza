import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeHexColor } from "@/utils/brand-color";

type Props = {
  imageUrl: string | null;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
};

async function loadImageBitmap(imageUrl: string): Promise<HTMLImageElement> {
  let objectUrl: string | null = null;
  try {
    let src = imageUrl;
    if (/^https?:\/\//i.test(imageUrl)) {
      const response = await axios.get(imageUrl, { responseType: "blob" });
      objectUrl = URL.createObjectURL(response.data as Blob);
      src = objectUrl;
    }
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load logo image"));
      img.src = src;
    });
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function LogoBrandColorPicker({ imageUrl, value, onChange, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }, []);

  useEffect(() => {
    imageRef.current = null;
    setLoadError(false);
    if (!imageUrl?.trim()) return;
    let cancelled = false;
    loadImageBitmap(imageUrl.trim())
      .then((img) => {
        if (cancelled) return;
        imageRef.current = img;
        drawCanvas();
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [imageUrl, drawCanvas]);

  const sampleAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(((clientX - rect.left) / rect.width) * canvas.width)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(((clientY - rect.top) / rect.height) * canvas.height)));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] < 10) return;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    onChange(hex);
  };

  const normalized = normalizeHexColor(value) ?? "";

  const tryEyeDropper = async () => {
    if (disabled) return;
    const eyeDropper = (window as Window & { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } })
      .EyeDropper;
    if (!eyeDropper) {
      return;
    }
    try {
      const dropper = new eyeDropper();
      const result = await dropper.open();
      const hex = normalizeHexColor(result.sRGBHex);
      if (hex) onChange(hex);
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="space-y-3">
      <Label>Brand color</Label>
      <p className="text-xs text-muted-foreground">
        Click the logo to pick a color, or use the color control. Used as the primary accent on the student app.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          {imageUrl && !loadError ? (
            <canvas
              ref={canvasRef}
              width={160}
              height={160}
              className={cn(
                "h-40 w-40 rounded-xl border border-border/60 bg-muted/30 object-contain",
                !disabled && "cursor-crosshair hover:ring-2 hover:ring-primary/40",
                disabled && "opacity-60 pointer-events-none",
              )}
              onClick={(e) => sampleAt(e.clientX, e.clientY)}
              title="Click the logo to select a color"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground text-center px-3">
              Upload a logo to pick a color
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="h-10 w-10 shrink-0 rounded-lg border border-border shadow-inner"
              style={{ backgroundColor: normalized || "#E85D04" }}
              aria-hidden
            />
            <Input
              type="color"
              value={normalized || "#E85D04"}
              disabled={disabled}
              className="h-10 w-14 cursor-pointer p-1"
              onChange={(e) => {
                const hex = normalizeHexColor(e.target.value);
                if (hex) onChange(hex);
              }}
            />
            <Input
              type="text"
              value={value}
              disabled={disabled}
              placeholder="#RRGGBB"
              className="max-w-[8.5rem] font-mono text-sm"
              onChange={(e) => onChange(e.target.value)}
              onBlur={() => {
                const hex = normalizeHexColor(value);
                if (hex) onChange(hex);
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => void tryEyeDropper()}>
              <Pipette className="mr-2 h-4 w-4" />
              Pick color
            </Button>
            {normalized ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => onChange("")}
              >
                Reset
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
