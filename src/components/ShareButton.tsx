"use client";

import { useCallback, useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import {
  Share2,
  Copy,
  Mail,
  MessageCircle,
  QrCode,
  Code,
  Download,
  X,
  Check,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { trackClientEvent } from "@/lib/client-analytics";

interface ShareOption {
  id: string;
  label: string;
  icon: ReactNode;
  action: () => void | Promise<void>;
}

interface ShareGroup {
  id: string;
  title: string;
  subtitle?: string;
  layout?: "list" | "grid";
  options: ShareOption[];
}

interface ShareButtonProps {
  url?: string;
  label?: string;
  /** Visual style variant */
  variant?: "default" | "subtle" | "icon-only";
  /** Size of the button */
  size?: "sm" | "md";
  /** Form title for sharing context */
  formTitle?: string;
  /** Additional classes */
  className?: string;
}

export default function ShareButton({
  url,
  label = "Share",
  variant = "default",
  size = "md",
  formTitle,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [embedCopied, setEmbedCopied] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<"top" | "bottom">("bottom");
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Embed customization state
  const [embedWidth, setEmbedWidth] = useState("100%");
  const [embedHeight, setEmbedHeight] = useState("600");
  const [embedTransparent, setEmbedTransparent] = useState(false);
  const [embedHideTitle, setEmbedHideTitle] = useState(false);
  const [embedHideBranding, setEmbedHideBranding] = useState(false);
  const [embedTheme, setEmbedTheme] = useState<"auto" | "light" | "dark">("auto");
  const [embedPadding, setEmbedPadding] = useState("16");

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!showMenu) return;

    const updatePlacement = () => {
      const trigger = triggerRef.current;
      const dropdown = dropdownRef.current;
      if (!trigger || !dropdown) return;

      const triggerRect = trigger.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const dropdownHeight = dropdownRect.height;
      const measuredWidth = dropdownRect.width;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      const placement: "top" | "bottom" =
        spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom";

      setMenuPlacement((prev) => (prev === placement ? prev : placement));

      const verticalMargin = 16;
      let topPosition =
        placement === "top"
          ? triggerRect.top - dropdownHeight - 8
          : triggerRect.bottom + 8;

      const maxTop = window.innerHeight - dropdownHeight - verticalMargin;
      topPosition = Math.min(Math.max(topPosition, verticalMargin), Math.max(verticalMargin, maxTop));

      const horizontalMargin = 16;
      const availableWidth = Math.max(160, window.innerWidth - horizontalMargin * 2);
      const dropdownWidth = Math.min(measuredWidth, availableWidth);
      let leftPosition = triggerRect.right - dropdownWidth;
      leftPosition = Math.max(horizontalMargin, leftPosition);
      if (leftPosition + dropdownWidth > window.innerWidth - horizontalMargin) {
        leftPosition = Math.max(
          horizontalMargin,
          window.innerWidth - dropdownWidth - horizontalMargin
        );
      }

      const dropdownStyle = dropdown.style;
      dropdownStyle.position = "fixed";
      dropdownStyle.top = `${Math.round(topPosition)}px`;
      dropdownStyle.left = `${Math.round(leftPosition)}px`;
      dropdownStyle.right = "auto";
      dropdownStyle.bottom = "auto";
      dropdownStyle.transform = "translate3d(0, 0, 0)";
      dropdownStyle.width = `${Math.round(dropdownWidth)}px`;
      dropdownStyle.maxHeight = `${Math.max(240, window.innerHeight - verticalMargin * 2)}px`;
      dropdownStyle.overflowY = "auto";
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const menuNode = menuRef.current;
      const dropdownNode = dropdownRef.current;
      if (!menuNode) return;

      const target = event.target as Node;
      if (!menuNode.contains(target) && (!dropdownNode || !dropdownNode.contains(target))) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMenu]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const effectiveUrl = useMemo(() => {
    if (url) return url;
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  }, [url]);

  const effectiveTitle = useMemo(() => {
    if (formTitle) return formTitle;
    if (typeof document !== "undefined" && document.title) {
      return document.title;
    }
    return "Form";
  }, [formTitle]);

  const nativeShareAvailable = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const shareGroups = useMemo<ShareGroup[]>(() => {
    const messagingOptions: ShareOption[] = [
      {
        id: "email",
        label: "Email",
        icon: <Mail className="w-4 h-4" />,
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const subject = encodeURIComponent(effectiveTitle);
          const body = encodeURIComponent(`Check out this form: ${effectiveUrl}`);
          window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
          trackClientEvent("form_shared", { shareMethod: "email" });
          setShowMenu(false);
        },
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        icon: <MessageCircle className="w-4 h-4" />,
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const text = encodeURIComponent(`${effectiveTitle}: ${effectiveUrl}`);
          window.open(`https://wa.me/?text=${text}`, "_blank");
          setShowMenu(false);
        },
      },
    ];

    if (nativeShareAvailable && effectiveUrl) {
      messagingOptions.unshift({
        id: "native",
        label: "Share via device",
        icon: <Share2 className="w-4 h-4" />,
        action: async () => {
          if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
          try {
            await navigator.share({ title: effectiveTitle, url: effectiveUrl });
          } catch {
            return;
          }
          setShowMenu(false);
        },
      });
    }

    const socialOptions: ShareOption[] = [
      {
        id: "twitter",
        label: "X (Twitter)",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const text = encodeURIComponent(effectiveTitle);
          const shareLink = encodeURIComponent(effectiveUrl);
          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareLink}`, "_blank");
          setShowMenu(false);
        },
      },
      {
        id: "linkedin",
        label: "LinkedIn",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        ),
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const shareLink = encodeURIComponent(effectiveUrl);
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareLink}`, "_blank");
          setShowMenu(false);
        },
      },
      {
        id: "facebook",
        label: "Facebook",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        ),
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const shareLink = encodeURIComponent(effectiveUrl);
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareLink}`, "_blank");
          setShowMenu(false);
        },
      },
    ];

    const toolOptions: ShareOption[] = [
      {
        id: "qr",
        label: "QR Code",
        icon: <QrCode className="w-4 h-4" />,
        action: () => {
          if (!effectiveUrl) return;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(effectiveUrl)}`;
          setQrCodeUrl(qrUrl);
          setShowQR(true);
          setShowMenu(false);
        },
      },
      {
        id: "embed",
        label: "Embed Code",
        icon: <Code className="w-4 h-4" />,
        action: () => {
          if (!effectiveUrl) return;
          setShowEmbed(true);
          setShowMenu(false);
        },
      },
    ];

    const groups: ShareGroup[] = [
      {
        id: "messaging",
        title: "Quick share",
        subtitle: "Send the form directly to someone",
        layout: "list",
        options: messagingOptions,
      },
      {
        id: "social",
        title: "Social networks",
        subtitle: "Post the form to your feeds",
        layout: "grid",
        options: socialOptions,
      },
      {
        id: "tools",
        title: "More tools",
        layout: "list",
        options: toolOptions,
      },
    ];

    return groups.filter((group) => group.options.length > 0);
  }, [effectiveTitle, effectiveUrl, nativeShareAvailable]);

  const handleCopyLink = useCallback(async () => {
    if (!effectiveUrl) return;
    const success = await copyToClipboard(effectiveUrl);
    if (!success) {
      return;
    }
    setCopied(true);
    trackClientEvent("form_shared", { shareMethod: "link" });
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setShowMenu(false), 1500);
  }, [copyToClipboard, effectiveUrl]);

  const onQuickShare = useCallback(() => {
    setShowMenu((prev) => !prev);
  }, []);

  // Generate embed URL with customization params
  const getEmbedUrl = useCallback(() => {
    if (!effectiveUrl) return "";

    // Extract formId from URL (assumes /f/[formId] format)
    const urlParts = effectiveUrl.split("/");
    const formIdIndex = urlParts.findIndex(part => part === "f");
    const formId = formIdIndex !== -1 ? urlParts[formIdIndex + 1] : null;

    if (!formId) return effectiveUrl;

    // Build embed URL with parameters
    const baseUrl = effectiveUrl.replace(/\/f\//, "/embed/");
    const params = new URLSearchParams();

    if (embedTransparent) params.set("transparent", "true");
    if (embedHideTitle) params.set("hideTitle", "true");
    if (embedHideBranding) params.set("hideBranding", "true");
    if (embedTheme !== "auto") params.set("theme", embedTheme);
    if (embedPadding !== "16") params.set("padding", embedPadding);

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [effectiveUrl, embedTransparent, embedHideTitle, embedHideBranding, embedTheme, embedPadding]);

  const embedUrl = useMemo(() => getEmbedUrl(), [getEmbedUrl]);

  const embedCode = useMemo(() => {
    const widthAttr = embedWidth.includes("%") ? embedWidth : `${embedWidth}px`;
    return `<iframe src="${embedUrl}" width="${widthAttr}" height="${embedHeight}" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;
  }, [embedUrl, embedWidth, embedHeight]);

  const handleCopyEmbed = async () => {
    const success = await copyToClipboard(embedCode);
    if (success) {
      setEmbedCopied(true);
      trackClientEvent("form_shared", { shareMethod: "embed" });
      setTimeout(() => setEmbedCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackClientEvent("form_shared", { shareMethod: "qr" });
  };

  // Button style variants
  const buttonStyles = useMemo(() => {
    const baseStyles = "transition-colors flex items-center justify-center gap-2 font-medium";
    const sizeStyles = size === "sm"
      ? "px-2.5 py-1.5 text-xs rounded-md"
      : "px-4 py-2.5 text-sm rounded-lg";

    switch (variant) {
      case "subtle":
        return `${baseStyles} ${sizeStyles} border`;
      case "icon-only":
        return `${baseStyles} p-2.5 rounded-lg border`;
      default:
        return `${baseStyles} ${sizeStyles} bg-black dark:bg-white text-white dark:text-black`;
    }
  }, [variant, size]);

  return (
    <>
      <div className={`relative ${className || ""}`} ref={menuRef}>
        <button
          type="button"
          onClick={onQuickShare}
          ref={triggerRef}
          className={buttonStyles}
          style={
            variant === "subtle" || variant === "icon-only"
              ? { borderColor: 'var(--card-border)', color: 'var(--foreground)' }
              : undefined
          }
          aria-label="Share"
          aria-expanded={showMenu}
          aria-haspopup="menu"
          aria-controls="share-menu"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              {variant !== "icon-only" && <span className="text-green-600">Copied!</span>}
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              {variant !== "icon-only" && label}
            </>
          )}
        </button>

        {showMenu && mounted && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-50 w-72 max-w-[calc(100vw-2rem)] rounded-lg border shadow-lg transition-opacity duration-100 scrollbar-hidden"
            style={{
              background: 'var(--background)',
              borderColor: 'var(--card-border)',
            }}
            data-placement={menuPlacement}
            id="share-menu"
            role="menu"
          >
            {/* Quick Copy Section */}
            <div className="p-4 pb-3">
              <div
                className="space-y-3 rounded-lg border px-3 py-3"
                style={{
                  background: 'var(--background-subtle)',
                  borderColor: 'var(--card-border)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    style={{
                      background: 'var(--background)',
                      color: 'var(--foreground-muted)',
                    }}
                  >
                    <LinkIcon className="w-4 h-4" />
                  </span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                      Share link
                    </span>
                    <span
                      className="text-[11px] truncate max-w-40"
                      style={{ color: 'var(--foreground-muted)' }}
                      title={effectiveUrl}
                    >
                      {effectiveUrl.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopyLink();
                    }}
                    disabled={!effectiveUrl}
                    aria-label="Copy share link"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      background: 'var(--accent)',
                      color: 'white',
                    }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (effectiveUrl) window.open(effectiveUrl, '_blank');
                    }}
                    disabled={!effectiveUrl}
                    aria-label="Open form in new tab"
                    className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium border transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      borderColor: 'var(--card-border)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </button>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div
              className="space-y-3 border-t pt-3 pb-2"
              style={{ borderColor: 'var(--card-border)' }}
            >
              {shareGroups.map((group) => {
                const isGrid = group.layout === "grid";
                return (
                  <div key={group.id} className="px-2">
                    <div className="px-2">
                      <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{group.title}</p>
                      {group.subtitle && (
                        <p className="text-[11px]" style={{ color: 'var(--foreground-muted)' }}>{group.subtitle}</p>
                      )}
                    </div>
                    <div
                      className={isGrid ? "mt-2 grid grid-cols-2 gap-1.5" : "mt-2 flex flex-col gap-1"}
                    >
                      {group.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            void option.action();
                          }}
                          className={
                            isGrid
                              ? "flex w-full flex-col items-center gap-2 rounded-lg px-3 py-3 text-center text-sm transition-colors"
                              : "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                          }
                          style={{ color: 'var(--foreground)' }}
                          role="menuitem"
                        >
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              background: 'var(--background-subtle)',
                              color: 'var(--foreground-muted)',
                            }}
                          >
                            {option.icon}
                          </span>
                          <span
                            className={
                              isGrid
                                ? "text-center text-sm font-medium leading-tight"
                                : "text-left text-sm leading-tight"
                            }
                          >
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-6 max-w-sm w-full shadow-xl"
            style={{ background: 'var(--background)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>QR Code</h3>
              <button
                onClick={() => setShowQR(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56" />
              </div>
              <p className="text-sm text-center" style={{ color: 'var(--foreground-muted)' }}>
                Scan this QR code to access the form
              </p>
              <button
                onClick={downloadQRCode}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                }}
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Embed Code Modal */}
      {showEmbed && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="rounded-xl p-6 max-w-3xl w-full shadow-xl my-4"
            style={{ background: 'var(--background)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Embed Form</h3>
              <button
                onClick={() => setShowEmbed(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customization Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Customize Embed</h4>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                      Width
                    </label>
                    <select
                      value={embedWidth}
                      onChange={(e) => setEmbedWidth(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border"
                      style={{
                        background: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--foreground)'
                      }}
                    >
                      <option value="100%">100% (Full Width)</option>
                      <option value="500">500px</option>
                      <option value="600">600px</option>
                      <option value="700">700px</option>
                      <option value="800">800px</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                      Height
                    </label>
                    <select
                      value={embedHeight}
                      onChange={(e) => setEmbedHeight(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm border"
                      style={{
                        background: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--foreground)'
                      }}
                    >
                      <option value="400">400px</option>
                      <option value="500">500px</option>
                      <option value="600">600px</option>
                      <option value="700">700px</option>
                      <option value="800">800px</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                    Theme
                  </label>
                  <select
                    value={embedTheme}
                    onChange={(e) => setEmbedTheme(e.target.value as "auto" | "light" | "dark")}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--foreground)'
                    }}
                  >
                    <option value="auto">Auto (System)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                {/* Padding */}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--foreground-muted)' }}>
                    Padding
                  </label>
                  <select
                    value={embedPadding}
                    onChange={(e) => setEmbedPadding(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      background: 'var(--input-bg)',
                      borderColor: 'var(--input-border)',
                      color: 'var(--foreground)'
                    }}
                  >
                    <option value="0">None</option>
                    <option value="8">Small (8px)</option>
                    <option value="16">Medium (16px)</option>
                    <option value="24">Large (24px)</option>
                    <option value="32">Extra Large (32px)</option>
                  </select>
                </div>

                {/* Toggle Options */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={embedTransparent}
                      onChange={(e) => setEmbedTransparent(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>Transparent Background</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={embedHideTitle}
                      onChange={(e) => setEmbedHideTitle(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>Hide Form Title</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={embedHideBranding}
                      onChange={(e) => setEmbedHideBranding(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>Hide Branding</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Preview</h4>
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{
                    background: embedTransparent ? 'repeating-conic-gradient(#d4d4d4 0% 25%, #fff 0% 50%) 50% / 16px 16px' : 'var(--background)',
                    borderColor: 'var(--card-border)',
                    height: '300px',
                  }}
                >
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    title="Form Embed Preview"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Embed Code */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Embed Code</h4>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                Copy this code and paste it into your website&apos;s HTML:
              </p>
              <div className="relative">
                <pre
                  className="p-4 rounded-lg text-sm overflow-x-auto"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                  }}
                >
                  <code>{embedCode}</code>
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className="absolute top-2 right-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                  }}
                >
                  {embedCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Direct Embed URL */}
              <div className="pt-2">
                <p className="text-xs mb-2" style={{ color: 'var(--foreground-muted)' }}>
                  Or use this direct URL for embedding:
                </p>
                <div
                  className="flex items-center gap-2 p-2 rounded-lg text-xs break-all"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground-muted)',
                  }}
                >
                  <LinkIcon className="w-3 h-3 shrink-0" />
                  <span className="flex-1">{embedUrl}</span>
                  <button
                    onClick={async () => {
                      await copyToClipboard(embedUrl);
                      setEmbedCopied(true);
                      setTimeout(() => setEmbedCopied(false), 2000);
                    }}
                    className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
