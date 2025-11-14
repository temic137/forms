"use client";

import { useCallback, useState, useRef, useEffect, useMemo } from "react";
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
  Send,
  MessageSquare,
  Printer,
} from "lucide-react";

interface ShareOption {
  id: string;
  label: string;
  icon: ReactNode;
  action: () => void | Promise<void>;
}

export default function ShareButton({ url, label = "Share" }: { url?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [embedCopied, setEmbedCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    if (typeof document !== "undefined" && document.title) {
      return document.title;
    }
    return "Form";
  }, []);

  const nativeShareAvailable = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const shareOptions = useMemo<ShareOption[]>(() => {
    const options: ShareOption[] = [
      {
        id: "copy",
        label: "Copy Link",
        icon: <Copy className="w-4 h-4" />,
        action: async () => {
          if (!effectiveUrl) return;
          const success = await copyToClipboard(effectiveUrl);
          if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            setTimeout(() => setShowMenu(false), 1500);
          }
        },
      },
      {
        id: "email",
        label: "Email",
        icon: <Mail className="w-4 h-4" />,
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const subject = encodeURIComponent(effectiveTitle);
          const body = encodeURIComponent(`Check out this form: ${effectiveUrl}`);
          window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
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
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        ),
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const shareLink = encodeURIComponent(effectiveUrl);
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareLink}`, "_blank");
          setShowMenu(false);
        },
      },
      {
        id: "telegram",
        label: "Telegram",
        icon: <Send className="w-4 h-4" />,
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const text = encodeURIComponent(effectiveTitle);
          const shareLink = encodeURIComponent(effectiveUrl);
          window.open(`https://t.me/share/url?url=${shareLink}&text=${text}`, "_blank");
          setShowMenu(false);
        },
      },
      {
        id: "reddit",
        label: "Reddit",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
        ),
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const title = encodeURIComponent(effectiveTitle);
          const shareLink = encodeURIComponent(effectiveUrl);
          window.open(`https://www.reddit.com/submit?url=${shareLink}&title=${title}`, "_blank");
          setShowMenu(false);
        },
      },
      {
        id: "sms",
        label: "SMS",
        icon: <MessageSquare className="w-4 h-4" />,
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const text = encodeURIComponent(`${effectiveTitle}: ${effectiveUrl}`);
          // iOS uses &body=, Android uses ?body=, this works for both
          const smsUrl = `sms:?&body=${text}`;
          window.open(smsUrl, "_self");
          setShowMenu(false);
        },
      },
      {
        id: "slack",
        label: "Slack",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 15a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2h2v2zm1 0a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-5zM9 6a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2v2H9zm0 1a2 2 0 0 1 2 2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5zm9 2a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2V9zm-1 0a2 2 0 0 1-2 2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5zm-2 9a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-2h2zm0-1a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-5z"/>
          </svg>
        ),
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const text = encodeURIComponent(`${effectiveTitle}: ${effectiveUrl}`);
          window.open(`https://slack.com/intl/en-us/help/articles/201330256-Share-links-in-Slack?text=${text}`, "_blank");
          setShowMenu(false);
        },
      },
      {
        id: "discord",
        label: "Discord",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        ),
        action: () => {
          if (!effectiveUrl) return;
          // Discord doesn't have a direct share URL, so we copy to clipboard with a message
          const message = `Share this link in Discord: ${effectiveUrl}`;
          void copyToClipboard(message).then((success) => {
            if (success) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          });
          setShowMenu(false);
        },
      },
      {
        id: "pinterest",
        label: "Pinterest",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162c-.105-.949-.199-2.403.041-3.439c.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911c1.024 0 1.518.769 1.518 1.688c0 1.029-.653 2.567-.992 3.992c-.285 1.193.6 2.165 1.775 2.165c2.128 0 3.768-2.245 3.768-5.487c0-2.861-2.063-4.869-5.008-4.869c-3.41 0-5.409 2.562-5.409 5.199c0 1.033.394 2.143.889 2.741c.099.12.112.225.085.345c-.09.375-.293 1.199-.334 1.363c-.053.225-.172.271-.401.165c-1.495-.69-2.433-2.878-2.433-4.646c0-3.776 2.748-7.252 7.92-7.252c4.158 0 7.392 2.967 7.392 6.923c0 4.135-2.607 7.462-6.233 7.462c-1.225 0-2.369-.647-2.758-1.409c0 0-.6 2.298-.744 2.839c-.282 1.084-1.064 2.456-1.549 3.235C9.584 23.815 10.77 24 12.017 24c6.627 0 11.999-5.373 11.999-11.987C24.016 5.367 18.644 0 12.017 0z"/>
          </svg>
        ),
        action: () => {
          if (!effectiveUrl || typeof window === "undefined") return;
          const description = encodeURIComponent(effectiveTitle);
          const shareLink = encodeURIComponent(effectiveUrl);
          window.open(`https://pinterest.com/pin/create/button/?url=${shareLink}&description=${description}`, "_blank");
          setShowMenu(false);
        },
      },
      {
        id: "print",
        label: "Print",
        icon: <Printer className="w-4 h-4" />,
        action: () => {
          if (typeof window === "undefined") return;
          window.print();
          setShowMenu(false);
        },
      },
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

    if (nativeShareAvailable && effectiveUrl) {
      options.unshift({
        id: "native",
        label: "Share via device",
        icon: <Share2 className="w-4 h-4" />,
        action: async () => {
          if (typeof navigator === "undefined" || typeof navigator.share !== "function") return;
          try {
            await navigator.share({ title: effectiveTitle, url: effectiveUrl });
          } catch {
            // Swallow aborts/cancellations so the menu stays open if nothing happens
            return;
          }
          setShowMenu(false);
        },
      });
    }

    return options;
  }, [copyToClipboard, effectiveTitle, effectiveUrl, nativeShareAvailable]);

  const onQuickShare = useCallback(() => {
    setShowMenu((prev) => !prev);
  }, []);

  const embedCode = `<iframe src="${effectiveUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  const handleCopyEmbed = async () => {
    const success = await copyToClipboard(embedCode);
    if (success) {
      setEmbedCopied(true);
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
  };

  // Group share options for better organization
  const groupedOptions = useMemo(() => {
    const groups: { [key: string]: ShareOption[] } = {
      direct: [],
      social: [],
      advanced: [],
    };

    shareOptions.forEach((option) => {
      if (["native", "copy", "sms", "email"].includes(option.id)) {
        groups.direct.push(option);
      } else if (["whatsapp", "telegram", "twitter", "linkedin", "facebook", "reddit", "pinterest", "slack", "discord"].includes(option.id)) {
        groups.social.push(option);
      } else {
        groups.advanced.push(option);
      }
    });

    return groups;
  }, [shareOptions]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={onQuickShare}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 w-full"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            color: 'var(--foreground)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--card-bg-hover)';
            e.currentTarget.style.borderColor = 'var(--card-border-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card-bg)';
            e.currentTarget.style.borderColor = 'var(--card-border)';
          }}
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
          <span className="flex-1 text-left">{copied ? "Link copied!" : label}</span>
        </button>

        {showMenu && (
          <div 
            className="absolute left-0 bottom-full mb-2 rounded-lg z-50"
            style={{
              minWidth: '280px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow-hover)',
              borderRadius: 'var(--card-radius)',
            }}
          >
            <div className="py-2">
              {/* Direct Sharing Group */}
              {groupedOptions.direct.length > 0 && (
                <>
                  {groupedOptions.direct.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        void option.action();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 group"
                      style={{
                        color: 'var(--foreground)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--card-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>
                        {option.icon}
                      </span>
                      <span className="flex-1">{option.label}</span>
                      {option.id === "copy" && copied && (
                        <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                      )}
                    </button>
                  ))}
                  {groupedOptions.social.length > 0 && (
                    <div className="h-px my-1" style={{ background: 'var(--divider)' }} />
                  )}
                </>
              )}

              {/* Social Media Group */}
              {groupedOptions.social.length > 0 && (
                <>
                  {groupedOptions.social.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        void option.action();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 group"
                      style={{
                        color: 'var(--foreground)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--card-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>
                        {option.icon}
                      </span>
                      <span className="flex-1">{option.label}</span>
                    </button>
                  ))}
                  {groupedOptions.advanced.length > 0 && (
                    <div className="h-px my-1" style={{ background: 'var(--divider)' }} />
                  )}
                </>
              )}

              {/* Advanced Options Group */}
              {groupedOptions.advanced.length > 0 && (
                <>
                  {groupedOptions.advanced.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        void option.action();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-3 group"
                      style={{
                        color: 'var(--foreground)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--card-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="flex-shrink-0" style={{ color: 'var(--foreground-muted)' }}>
                        {option.icon}
                      </span>
                      <span className="flex-1">{option.label}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-lg p-6 max-w-sm w-full"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--card-radius-lg)',
              boxShadow: 'var(--card-shadow-hover)',
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                QR Code
              </h3>
              <button
                onClick={() => setShowQR(false)}
                className="transition-colors"
                style={{ color: 'var(--foreground-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--foreground)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--foreground-muted)';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 bg-white p-4 rounded-lg" />
              <p 
                className="text-sm text-center"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Scan this QR code to access the form
              </p>
              <button
                onClick={downloadQRCode}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-dark)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                }}
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Code Modal */}
      {showEmbed && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-lg p-6 max-w-2xl w-full"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--card-radius-lg)',
              boxShadow: 'var(--card-shadow-hover)',
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 
                className="text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                Embed Code
              </h3>
              <button
                onClick={() => setShowEmbed(false)}
                className="transition-colors"
                style={{ color: 'var(--foreground-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--foreground)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--foreground-muted)';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p 
                className="text-sm"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Copy this code and paste it into your website&apos;s HTML:
              </p>
              <div className="relative">
                <pre 
                  className="p-4 rounded-lg text-sm overflow-x-auto"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  <code>{embedCode}</code>
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className="absolute top-2 right-2 px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-dark)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent)';
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
              <div 
                className="rounded-lg p-4"
                style={{
                  background: 'var(--background-subtle)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <h4 
                  className="text-sm font-medium mb-2"
                  style={{ color: 'var(--foreground)' }}
                >
                  Preview
                </h4>
                <div 
                  className="rounded overflow-hidden"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  <iframe
                    src={effectiveUrl}
                    className="w-full h-64"
                    title="Form Preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


