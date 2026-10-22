"use strict";
/* ---------------------------------------------------------------- *
     * Mobile navigation
     * ---------------------------------------------------------------- */
    const menuButton = document.getElementById("menuButton");
    const mobileMenu = document.getElementById("mobileMenu");
    const menuIconOpen = document.getElementById("menuIconOpen");
    const menuIconClose = document.getElementById("menuIconClose");

    function isMenuOpen() {
      return menuButton.getAttribute("aria-expanded") === "true";
    }

    function setMenu(open) {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      mobileMenu.classList.toggle("hidden", !open);
      menuIconOpen.classList.toggle("hidden", open);
      menuIconClose.classList.toggle("hidden", !open);
    }

    menuButton.addEventListener("click", () => setMenu(!isMenuOpen()));

    mobileMenu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isMenuOpen()) {
        setMenu(false);
        menuButton.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!isMenuOpen()) return;
      if (event.target.closest("#mobileMenu") || event.target.closest("#menuButton")) return;
      setMenu(false);
    });

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const handleDesktopChange = (event) => { if (event.matches) setMenu(false); };
    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleDesktopChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleDesktopChange);
    }

    /* ---------------------------------------------------------------- *
     * Shortener
     * ---------------------------------------------------------------- */
    const form = document.getElementById("shortenForm");
    const longUrlInput = document.getElementById("longUrl");
    const shortenButton = document.getElementById("shortenButton");
    const buttonText = document.getElementById("buttonText");
    const urlError = document.getElementById("urlError");
    const result = document.getElementById("result");
    const shortUrlInput = document.getElementById("shortUrl");
    const openLink = document.getElementById("openLink");
    const qrImage = document.getElementById("qrImage");
    const qrLoading = document.getElementById("qrLoading");
    const downloadQr = document.getElementById("downloadQr");
    const copyStatus = document.getElementById("copyStatus");
    let originalUrl = "";

    document.getElementById("year").textContent = new Date().getFullYear();

    function setError(message) {
      urlError.textContent = message;
      urlError.classList.toggle("hidden", !message);
    }

    function normalizeAndValidateUrl(raw) {
      const value = raw.trim();
      if (!value) throw new Error("Please paste a URL first.");
      if (/\s/.test(value)) throw new Error("The URL cannot contain spaces.");
      let parsed;
      try { parsed = new URL(value); } catch { throw new Error("Enter a valid URL, such as https://example.com/page."); }
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http:// and https:// links are supported.");
      if (!parsed.hostname || !parsed.hostname.includes(".")) throw new Error("Enter a complete public web address.");
      if (["localhost", "127.0.0.1", "::1"].includes(parsed.hostname.toLowerCase())) throw new Error("Localhost links cannot be shortened.");
      return parsed.href;
    }

    function setLoading(isLoading) {
      shortenButton.disabled = isLoading;
      shortenButton.setAttribute("aria-busy", String(isLoading));
      buttonText.textContent = isLoading ? "Working…" : "Shorten URL";

      const existing = document.getElementById("loadingSpinner");
      if (isLoading && !existing) {
        const spinner = document.createElement("span");
        spinner.className = "spinner";
        spinner.id = "loadingSpinner";
        spinner.setAttribute("aria-hidden", "true");
        shortenButton.prepend(spinner);
      } else if (!isLoading && existing) {
        existing.remove();
      }
    }

    let qrObjectUrl = null;
    let qrLibraryPromise = null;

    function loadQrLibrary() {
      if (window.QRCode) return Promise.resolve(window.QRCode);
      if (qrLibraryPromise) return qrLibraryPromise;

      qrLibraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
        script.async = true;
        script.onload = () => window.QRCode ? resolve(window.QRCode) : reject(new Error("QR library did not initialize."));
        script.onerror = () => reject(new Error("Could not load the QR code library."));
        document.head.appendChild(script);
      });
      return qrLibraryPromise;
    }

    async function showQr(url) {
      qrImage.classList.add("hidden");
      qrLoading.textContent = "Generating QR code…";
      qrLoading.classList.remove("hidden");
      downloadQr.removeAttribute("href");

      try {
        // Generate the QR locally in the browser; the QR data is the actual short URL.
        await loadQrLibrary();
        const holder = document.createElement("div");
        holder.style.cssText = "position:fixed;left:-10000px;top:0;width:320px;height:320px;";
        document.body.appendChild(holder);

        new window.QRCode(holder, {
          text: url,
          width: 320,
          height: 320,
          colorDark: "#111827",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H
        });

        // qrcodejs renders a canvas on modern browsers and may also provide an img.
        const canvas = holder.querySelector("canvas");
        const image = holder.querySelector("img");
        let dataUrl = "";
        if (canvas && canvas.width > 0) {
          dataUrl = canvas.toDataURL("image/png");
        } else if (image && image.src) {
          if (image.src.startsWith("data:")) {
            dataUrl = image.src;
          } else {
            const qrCanvas = document.createElement("canvas");
            qrCanvas.width = 320;
            qrCanvas.height = 320;
            const ctx = qrCanvas.getContext("2d");
            await new Promise((resolve, reject) => {
              image.onload = resolve;
              image.onerror = reject;
              if (image.complete && image.naturalWidth) resolve();
            });
            ctx.drawImage(image, 0, 0, 320, 320);
            dataUrl = qrCanvas.toDataURL("image/png");
          }
        }
        holder.remove();

        if (!dataUrl) throw new Error("QR code image could not be created.");
        if (qrObjectUrl) {
          URL.revokeObjectURL(qrObjectUrl);
          qrObjectUrl = null;
        }
        qrImage.src = dataUrl;
        qrImage.alt = "QR code for " + url;
        qrImage.classList.remove("hidden");
        qrLoading.classList.add("hidden");
        downloadQr.href = dataUrl;
        downloadQr.download = "snaplink-qr.png";
        downloadQr.textContent = "Download QR code ↓";
      } catch (error) {
        qrImage.classList.add("hidden");
        qrLoading.textContent = "Could not generate QR code. Check your connection and try again.";
        qrLoading.classList.remove("hidden");
        console.error("QR generation failed:", error);
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (shortenButton.disabled) return;      // guard against duplicate submissions

      setError("");
      copyStatus.textContent = "";
      result.classList.add("hidden");

      let url;
      try { url = normalizeAndValidateUrl(longUrlInput.value); }
      catch (error) { setError(error.message); longUrlInput.focus(); return; }

      originalUrl = url;
      setLoading(true);
      try {
        // os8.me API: POST JSON to https://os8.me/ and read the short_url field.
        const response = await fetch("https://os8.me/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.short_url) {
          throw new Error(data.message || "The shortening service could not create a link. Please try again.");
        }
        let shortUrl;
        try {
          shortUrl = new URL(data.short_url);
          if (!["http:", "https:"].includes(shortUrl.protocol) || shortUrl.hostname !== "os8.me") throw new Error();
        } catch {
          throw new Error("The shortening service returned an unexpected URL. Please try again.");
        }

        shortUrlInput.value = shortUrl.href;
        openLink.href = shortUrl.href;
        result.classList.remove("hidden");
        showQr(shortUrl.href);
        result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (error) {
        const message = error instanceof TypeError
          ? "Could not reach the shortening service. Check your internet connection or try again later."
          : error.message;
        setError(message + " If this keeps happening, the provider may be unavailable or blocking browser requests.");
      } finally {
        setLoading(false);
      }
    });

    async function copyText(value, successMessage) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else {
          const temp = document.createElement("textarea");
          temp.value = value;
          temp.setAttribute("readonly", "");
          temp.style.position = "fixed";
          temp.style.opacity = "0";
          document.body.appendChild(temp);
          temp.select();
          const copied = document.execCommand("copy");
          temp.remove();
          if (!copied) throw new Error("Clipboard unavailable");
        }
        copyStatus.textContent = successMessage;
      } catch {
        copyStatus.textContent = "Copy was blocked by your browser. Select the URL and copy it manually.";
      }
    }

    document.getElementById("copyButton").addEventListener("click", () => {
      if (shortUrlInput.value) copyText(shortUrlInput.value, "Short URL copied to clipboard.");
    });
    document.getElementById("copyLongButton").addEventListener("click", () => {
      if (originalUrl) copyText(originalUrl, "Original URL copied to clipboard.");
    });
    longUrlInput.addEventListener("input", () => {
      if (!urlError.classList.contains("hidden")) setError("");
    });
