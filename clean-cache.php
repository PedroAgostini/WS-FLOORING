<?php
/**
 * WS Flooring | Clean cache
 * Open https://wsflooring.escolats.com.br/clean-cache to wipe this browser's
 * cached copy of the site (CSS, JS, images, local data) after a deploy.
 * It only affects the browser that opens it. Needs HTTPS.
 */
header('Clear-Site-Data: "cache", "storage"');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Robots-Tag: noindex, nofollow');
header('Content-Type: text/html; charset=utf-8');
$stamp = date('YmdHis');
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta http-equiv="refresh" content="2;url=/?fresh=<?= $stamp ?>">
  <title>Cache cleared | WS Flooring</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; text-align: center;
      font-family: "Century Gothic", "Avenir Next", Avenir, system-ui, sans-serif; background: #101112; color: #F3F1EC; }
    img { width: 56px; height: 56px; margin: 0 auto 22px; display: block; }
    h1 { margin: 0 0 8px; font-size: 1.75rem; font-weight: 300; letter-spacing: -.02em; }
    p { margin: 6px 0; color: #BDBAB3; }
    a { color: #CDAA7A; }
  </style>
</head>
<body>
  <div>
    <img src="/favicon.svg" alt="" width="56" height="56">
    <h1>Cache cleared.</h1>
    <p>Loading the latest version of the site&hellip;</p>
    <p><a href="/?fresh=<?= $stamp ?>">Go now</a></p>
  </div>
</body>
</html>
