<?php
/**
 * Talhive Blog Admin — No-API Edition
 * ────────────────────────────────────────────────────────────────
 * Drop this file at:  /admin/index.php
 * Visit:              https://www.talhive.com/admin/
 *
 * How to use:
 *  1. Change ADMIN_PASSWORD below
 *  2. Upload to cPanel at public_html/admin/index.php
 *  3. Create a .md file with optional frontmatter (see README section)
 *  4. Upload via the dashboard → blog .html is created, sitemap + index updated
 *
 * Markdown frontmatter format (optional, put at top of .md file):
 *  ---
 *  title: Your Post Title Here
 *  category: AI & Recruitment
 *  description: 150-char meta description
 *  keywords: keyword one, keyword two
 *  ---
 */

// ── CONFIGURATION ────────────────────────────────────────────────
const ADMIN_PASS  = 'talhive2025';           // ← CHANGE THIS
const SITE_URL    = 'https://www.talhive.com';
const SITE_ROOT   = __DIR__ . '/..';         // one level up from /admin/
const BLOG_DIR    = SITE_ROOT . '/blog';
const SITEMAP     = SITE_ROOT . '/sitemap.xml';
const BLOG_INDEX  = BLOG_DIR  . '/index.html';
// ─────────────────────────────────────────────────────────────────

session_start();
$error = $success = $generated = null;

// ── AUTH ─────────────────────────────────────────────────────────
if (isset($_POST['pw'])) {
    if ($_POST['pw'] === ADMIN_PASS) { $_SESSION['ok'] = true; }
    else { $error = 'Incorrect password.'; }
}
if (isset($_GET['logout'])) { session_destroy(); header('Location: /admin/'); exit; }
$auth = !empty($_SESSION['ok']);

// ── HANDLE POST ──────────────────────────────────────────────────
if ($auth && $_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_POST['pw'])) {
    [$error, $success, $generated] = processUpload();
}

// ── PROCESS UPLOAD ───────────────────────────────────────────────
function processUpload(): array {
    if (empty($_FILES['mdfile']['name']))
        return ['No file selected.', null, null];

    $f = $_FILES['mdfile'];
    if ($f['error'] !== UPLOAD_ERR_OK)
        return ['Upload error code: ' . $f['error'], null, null];

    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if ($ext !== 'md')
        return ['Only .md files are accepted.', null, null];

    $raw  = file_get_contents($f['tmp_name']);
    if (!$raw) return ['Could not read file.', null, null];

    // Parse frontmatter + body
    $fm   = parseFrontmatter($raw);
    $slug = slugify(pathinfo($f['name'], PATHINFO_FILENAME));
    $dest = BLOG_DIR . '/' . $slug . '.html';

    if (file_exists($dest) && empty($_POST['overwrite']))
        return ["<strong>blog/{$slug}.html already exists.</strong> Tick \"Overwrite\" to replace it.", null, null];

    // Build the blog HTML
    $html = buildBlogHTML($fm, $slug);

    // Write file
    if (!@file_put_contents($dest, $html))
        return ['Cannot write to blog/ directory. Check cPanel folder permissions (755).', null, null];

    // Update sitemap + index
    updateSitemap($slug, $fm);
    updateBlogIndex($slug, $fm);

    $meta = ['slug' => $slug, 'title' => $fm['title'], 'category' => $fm['category']];
    return [null, "Blog post created: <a href=\"" . SITE_URL . "/blog/{$slug}.html\" target=\"_blank\">View live →</a>", $meta];
}

// ── FRONTMATTER PARSER ───────────────────────────────────────────
function parseFrontmatter(string $raw): array {
    $fm   = ['title'=>'','category'=>'Recruitment','description'=>'','keywords'=>'','body'=>''];
    $body = $raw;

    if (str_starts_with(ltrim($raw), '---')) {
        $raw   = ltrim($raw);
        $end   = strpos($raw, '---', 3);
        if ($end !== false) {
            $block = substr($raw, 3, $end - 3);
            $body  = trim(substr($raw, $end + 3));
            foreach (explode("\n", $block) as $line) {
                if (str_contains($line, ':')) {
                    [$k, $v] = explode(':', $line, 2);
                    $fm[strtolower(trim($k))] = trim($v);
                }
            }
        }
    }

    // Extract title from first H1 if not in frontmatter
    if (empty($fm['title'])) {
        if (preg_match('/^#\s+(.+)$/m', $body, $m))
            $fm['title'] = trim($m[1]);
    }

    // Auto description from first paragraph
    if (empty($fm['description'])) {
        $stripped = preg_replace('/^#+.+$/m', '', $body);
        $stripped = preg_replace('/^---.*?---/s', '', $stripped);
        $paras = array_filter(array_map('trim', explode("\n\n", $stripped)));
        foreach ($paras as $p) {
            $clean = trim(preg_replace('/[#*`>_\[\]!]/', '', $p));
            if (strlen($clean) > 40) {
                $fm['description'] = mb_substr($clean, 0, 155);
                break;
            }
        }
    }

    $fm['body'] = $body;
    return $fm;
}

// ── MARKDOWN → HTML ──────────────────────────────────────────────
function mdToHtml(string $md): array {
    // Returns ['html' => ..., 'faqs' => [...], 'intro' => '...']
    $lines  = explode("\n", $md);
    $html   = '';
    $faqs   = [];
    $intro  = '';
    $inList = false; $listType = '';
    $inCode = false; $codeBuf = '';
    $inFaq  = false; $faqQ = ''; $faqA = [];
    $paraLines = [];
    $introSet = false;

    $flushPara = function() use (&$paraLines, &$html, &$intro, &$introSet) {
        if (!$paraLines) return;
        $text = implode(' ', $paraLines);
        $text = inlineFormat($text);
        if (!$introSet && strlen(strip_tags($text)) > 40) {
            $intro    = strip_tags($text);
            $introSet = true;
        }
        $html .= '<p style="margin-bottom:24px">' . $text . "</p>\n";
        $paraLines = [];
    };

    $flushList = function() use (&$inList, &$listType, &$html) {
        if (!$inList) return;
        $tag  = $listType === 'ol' ? 'ol' : 'ul';
        $style = $listType === 'ul'
            ? 'list-style:none;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 24px;margin-bottom:32px'
            : 'padding-left:1.5rem;margin-bottom:32px;color:var(--grey-200)';
        // close the open tag — this func is called when we switch context
        // The list items were already appended; we need to wrap them.
        // Use a marker approach instead:
        $inList = false;
    };

    // Two-pass approach for lists
    $blocks = [];
    $cur = ['type'=>'p','lines'=>[]];

    foreach ($lines as $line) {
        // Code fence
        if (str_starts_with($line, '```')) {
            if (!$inCode) { $inCode = true; $codeBuf = ''; continue; }
            $inCode = false;
            $blocks[] = ['type'=>'code','content'=>$codeBuf];
            continue;
        }
        if ($inCode) { $codeBuf .= $line . "\n"; continue; }

        // Headings
        if (preg_match('/^(#{1,4})\s+(.+)$/', $line, $m)) {
            $blocks[] = ['type'=>'p','lines'=>$cur['lines']];
            $cur = ['type'=>'p','lines'=>[]];
            $blocks[] = ['type'=>'h','level'=>strlen($m[1]),'text'=>$m[2]];
            continue;
        }

        // Blank line = end of paragraph/block
        if (trim($line) === '') {
            if ($cur['lines']) { $blocks[] = $cur; $cur = ['type'=>'p','lines'=>[]]; }
            continue;
        }

        // Unordered list
        if (preg_match('/^[-*]\s+(.+)$/', $line, $m)) {
            if ($cur['type'] !== 'ul') {
                if ($cur['lines']) { $blocks[] = $cur; }
                $cur = ['type'=>'ul','lines'=>[]];
            }
            $cur['lines'][] = $m[1];
            continue;
        }

        // Ordered list
        if (preg_match('/^\d+\.\s+(.+)$/', $line, $m)) {
            if ($cur['type'] !== 'ol') {
                if ($cur['lines']) { $blocks[] = $cur; }
                $cur = ['type'=>'ol','lines'=>[]];
            }
            $cur['lines'][] = $m[1];
            continue;
        }

        // Blockquote
        if (str_starts_with($line, '> ')) {
            if ($cur['type'] !== 'bq') {
                if ($cur['lines']) { $blocks[] = $cur; }
                $cur = ['type'=>'bq','lines'=>[]];
            }
            $cur['lines'][] = substr($line, 2);
            continue;
        }

        // HR
        if (preg_match('/^[-*_]{3,}$/', trim($line))) {
            if ($cur['lines']) { $blocks[] = $cur; $cur = ['type'=>'p','lines'=>[]]; }
            $blocks[] = ['type'=>'hr'];
            continue;
        }

        $cur['lines'][] = $line;
    }
    if ($cur['lines']) $blocks[] = $cur;

    // Render blocks
    $introSet = false;
    $inFaqSection = false;
    $faqQ = ''; $faqALines = [];

    $saveFaq = function() use (&$faqs, &$faqQ, &$faqALines) {
        if ($faqQ && $faqALines) {
            $faqs[] = ['q' => trim($faqQ), 'a' => trim(implode(' ', $faqALines))];
            $faqQ = ''; $faqALines = [];
        }
    };

    foreach ($blocks as $b) {
        switch ($b['type']) {
            case 'h':
                $text = $b['text'];
                // Detect FAQ section
                if (preg_match('/^(FAQ|frequently asked questions)/i', $text)) {
                    $inFaqSection = true;
                    continue 2;
                }
                if ($inFaqSection) { $saveFaq(); $inFaqSection = false; }

                $lvl = $b['level'];
                if ($lvl === 1) {
                    // Skip H1 — used as page title
                } elseif ($lvl === 2) {
                    $html .= '<h2 style="font-size:1.4rem;font-weight:700;color:var(--white);margin:40px 0 16px">' . hsc($text) . "</h2>\n";
                } elseif ($lvl === 3) {
                    $html .= '<h3 style="font-size:1.1rem;font-weight:600;color:var(--grey-200);margin:28px 0 12px">' . hsc($text) . "</h3>\n";
                } else {
                    $html .= '<h4 style="font-size:1rem;font-weight:600;color:var(--grey-200);margin:20px 0 8px">' . hsc($text) . "</h4>\n";
                }
                break;

            case 'p':
                if (!$b['lines']) break;
                $text = implode(' ', $b['lines']);

                // In FAQ section: bold question → faq item
                if ($inFaqSection) {
                    if (preg_match('/^\*\*(.+?)\*\*/', $text, $m)) {
                        $saveFaq();
                        // $m[1] = ONLY the text inside **...** — never the full line
                        $faqQ = trim($m[1], '? ') . '?';
                        // Anything after the closing ** on the same line = start of answer
                        $rest = trim(preg_replace('/^\*\*[^*]+\*\*\??\s*/', '', $text));
                        if ($rest !== '') $faqALines[] = $rest;
                    } else {
                        $faqALines[] = $text;
                    }
                    break;
                }

                $formatted = inlineFormat($text);
                if (!$introSet && strlen(strip_tags($formatted)) > 40) {
                    $introSet = true;
                }
                $html .= '<p style="margin-bottom:24px">' . $formatted . "</p>\n";
                break;

            case 'ul':
                if ($inFaqSection) {
                    foreach ($b['lines'] as $li) { $faqALines[] = $li; }
                    break;
                }
                $items = array_map(fn($l) => '<li style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);color:var(--grey-200)">' . inlineFormat($l) . '</li>', $b['lines']);
                $html .= '<ul style="list-style:none;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 24px;margin-bottom:32px">' . implode('', $items) . "</ul>\n";
                break;

            case 'ol':
                $items = array_map(fn($l) => '<li style="margin-bottom:6px;color:var(--grey-200)">' . inlineFormat($l) . '</li>', $b['lines']);
                $html .= '<ol style="padding-left:1.5rem;margin-bottom:32px">' . implode('', $items) . "</ol>\n";
                break;

            case 'bq':
                $text = inlineFormat(implode(' ', $b['lines']));
                $html .= '<blockquote style="border-left:3px solid var(--green-500);padding:12px 20px;margin:32px 0;background:rgba(0,229,160,.06);border-radius:0 8px 8px 0;color:var(--grey-200)">' . $text . "</blockquote>\n";
                break;

            case 'code':
                $html .= '<pre style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:16px 20px;overflow-x:auto;margin-bottom:24px;font-size:.88rem;line-height:1.6"><code>' . hsc($b['content']) . "</code></pre>\n";
                break;

            case 'hr':
                $html .= '<hr style="border:none;border-top:1px solid rgba(255,255,255,.08);margin:40px 0">' . "\n";
                break;
        }
    }
    $saveFaq();

    return ['html' => $html, 'faqs' => $faqs];
}

function inlineFormat(string $t): string {
    $t = hsc($t);
    // Bold
    $t = preg_replace('/\*\*(.+?)\*\*/', '<strong style="color:var(--white);font-weight:700">$1</strong>', $t);
    // Italic
    $t = preg_replace('/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/', '<em>$1</em>', $t);
    // Inline code
    $t = preg_replace('/`([^`]+)`/', '<code style="background:rgba(255,255,255,.08);padding:2px 6px;border-radius:4px;font-size:.88em">$1</code>', $t);
    // Links
    $t = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2" style="color:var(--green-500);text-decoration:underline">$1</a>', $t);
    return $t;
}

function hsc(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

// ── SLUG ─────────────────────────────────────────────────────────
function slugify(string $s): string {
    $s = strtolower(trim($s));
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}

// ── BUILD FULL BLOG HTML ─────────────────────────────────────────
function buildBlogHTML(array $fm, string $slug): string {
    $parsed   = mdToHtml($fm['body']);
    $bodyHtml = $parsed['html'];
    $faqs     = $parsed['faqs'];

    $title    = $fm['title']    ?: 'Recruitment Insights';
    $cat      = $fm['category'] ?: 'Recruitment';
    $desc     = $fm['description'] ?: mb_substr(strip_tags($bodyHtml), 0, 155);
    $kw       = $fm['keywords'] ?: strtolower($title);
    $today    = date('Y-m-d');
    $url      = SITE_URL . '/blog/' . $slug . '.html';
    $seoTitle = mb_substr($title, 0, 55) . ' | Talhive';
    $formId   = 'bf' . preg_replace('/[^a-z0-9]/', '', $slug);

    // Schemas
    $faqSchema = '';
    if ($faqs) {
        $faqItems = array_map(fn($f) => [
            '@type' => 'Question',
            'name'  => $f['q'],
            'acceptedAnswer' => ['@type'=>'Answer','text'=>$f['a']]
        ], $faqs);
        $faqSchema = '<script type="application/ld+json">'
            . json_encode(['@context'=>'https://schema.org','@type'=>'FAQPage','mainEntity'=>$faqItems], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)
            . '</script>';
    }

    $blogSchema = json_encode([
        '@context'      => 'https://schema.org',
        '@type'         => 'BlogPosting',
        'headline'      => $seoTitle,
        'description'   => $desc,
        'url'           => $url,
        'datePublished' => $today,
        'dateModified'  => $today,
        'author'        => ['@type'=>'Person','name'=>'Talhive Editorial Team'],
        'publisher'     => [
            '@type' => 'Organization','name'=>'Talhive',
            'logo'  => ['@type'=>'ImageObject','url'=>'https://www.talhive.com/wp-content/uploads/2022/05/Talhive-Logo-1.png']
        ],
    ], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);

    $orgSchema = json_encode([
        '@context'     => 'https://schema.org',
        '@type'        => 'Organization',
        'name'         => 'Talhive',
        'url'          => 'https://www.talhive.com',
        'logo'         => 'https://www.talhive.com/wp-content/uploads/2022/05/Talhive-Logo-1.png',
        'contactPoint' => [['@type'=>'ContactPoint','telephone'=>'+91-99202-65005','contactType'=>'customer service','areaServed'=>'IN']],
        'sameAs'       => ['https://www.linkedin.com/company/talhive'],
    ], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);

    // FAQ HTML
    $faqHtml = '';
    if ($faqs) {
        $faqHtml = '<h2 style="font-size:1.4rem;font-weight:700;margin-bottom:24px">Frequently Asked Questions</h2>' . "\n";
        foreach ($faqs as $f) {
            $faqHtml .= '<div class="faq-item">'
                . '<button class="faq-question" aria-expanded="false">' . hsc($f['q']) . '<span class="faq-icon">+</span></button>'
                . '<div class="faq-answer"><div class="faq-answer-inner">' . hsc($f['a']) . '</div></div>'
                . '</div>' . "\n";
        }
    }

    // Breadcrumb label
    $breadLabel = mb_substr($title, 0, 50) . (mb_strlen($title) > 50 ? '…' : '');

    // Short intro from first paragraph
    $introText = '';
    if (preg_match('/<p[^>]*>(.+?)<\/p>/s', $bodyHtml, $m))
        $introText = mb_substr(strip_tags($m[1]), 0, 180) . (mb_strlen(strip_tags($m[1])) > 180 ? '…' : '');

    ob_start(); ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="preload" href="../images/talhive-logo.png" as="image" fetchpriority="high">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title><?= hsc($seoTitle) ?></title>
  <meta name="description" content="<?= hsc($desc) ?>">
  <meta name="keywords" content="<?= hsc($kw) ?>">
  <link rel="canonical" href="<?= hsc($url) ?>">
  <meta property="og:title" content="<?= hsc($seoTitle) ?>">
  <meta property="og:description" content="<?= hsc($desc) ?>">
  <meta property="og:url" content="<?= hsc($url) ?>">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://www.talhive.com/wp-content/uploads/2022/05/Talhive-OG.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"></noscript>
  <link rel="stylesheet" href="../global.css">
  <meta name="google-site-verification" content="qPdu7_cic53XAzeL8wQQuZ_1iQob_poFm8Bv7feNLCQ">
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-EQJ5ZHJ64Q"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-EQJ5ZHJ64Q');</script>
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MJS5P2T');</script>
  <script type="application/ld+json"><?= $blogSchema ?></script>
  <script type="application/ld+json"><?= $orgSchema ?></script>
  <?= $faqSchema ?>
  <link rel="icon" href="/favicon.png" type="image/png">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/favicon.png">
<style>
:root{--n9:#060c1e;--n8:#0a1328;--n7:#0d1a38;--g5:#00e5a0;--g6:#00b87d;--b5:#2979ff;--wh:#fff;--g2:#d8e0f0;--g4:#8892b0;--red:#ff4d6d;--sans:'Inter',system-ui,-apple-system,sans-serif;--nav:72px;--mw:1200px;--r-md:12px;--r-lg:20px;--r-full:9999px;--green-500:#00e5a0;--green-600:#00b87d;--blue-500:#2979ff;--grey-200:#d8e0f0;--grey-400:#8892b0;--white:#fff}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;overflow-x:hidden}
body{font-family:var(--sans);background:var(--n9);color:var(--wh);-webkit-font-smoothing:antialiased;overflow-x:hidden}
.page-body{padding-top:var(--nav)}
#th-header{position:fixed;top:0;left:0;right:0;z-index:1000;height:var(--nav);background:transparent;transition:background .25s ease,box-shadow .25s ease}
#th-header.scrolled{background:rgba(6,12,30,.95);backdrop-filter:blur(20px);box-shadow:0 1px 0 rgba(255,255,255,.06)}
.nav-inner{max-width:var(--mw);margin:0 auto;padding:0 24px;height:100%;display:flex;align-items:center;justify-content:space-between;gap:32px}
.nav-logo{display:flex;align-items:center;gap:10px;flex-shrink:0}
.nav-logo img{height:36px;width:auto;display:block}
.nav-cta{display:inline-flex;align-items:center;padding:10px 22px;background:linear-gradient(135deg,var(--g5),var(--g6));color:var(--n9)!important;border-radius:var(--r-full);font-weight:700;font-size:.9rem;text-decoration:none;flex-shrink:0}
.container{max-width:var(--mw);margin:0 auto;padding:0 24px}
.container-sm{max-width:860px;margin:0 auto;padding:0 24px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:var(--r-full);font-weight:600;font-size:.95rem;cursor:pointer;border:none;text-decoration:none;font-family:var(--sans);transition:all .25s ease;white-space:nowrap}
.btn-primary{background:linear-gradient(135deg,var(--g5),var(--g6));color:var(--n9);box-shadow:0 4px 20px rgba(0,229,160,.35)}
.badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:var(--r-full);font-size:.78rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.badge-green{background:rgba(0,229,160,.12);color:var(--g5);border:1px solid rgba(0,229,160,.2)}
.mb-16{margin-bottom:16px}
.breadcrumb{display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--g4);padding:16px 0}
.breadcrumb a{color:var(--g4);text-decoration:none}
.section-label{display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;font-size:.8rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--g5)}
.section-label::before{content:"";display:block;width:24px;height:2px;background:var(--g5);border-radius:2px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.card{background:var(--n8);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:28px;transition:border-color .2s,transform .2s}
.card:hover{border-color:rgba(0,229,160,.3);transform:translateY(-2px)}
.t-h1{font-size:clamp(1.8rem,4vw,3rem);font-weight:800;line-height:1.15;letter-spacing:-.03em}
.t-h4{font-size:1rem;font-weight:600;color:var(--wh)}
.t-body{font-size:1rem;line-height:1.72}
.text-muted{color:var(--g4)}
.form-group{margin-bottom:20px}
.form-label{display:block;font-size:.82rem;font-weight:600;color:var(--g2);margin-bottom:7px}
.required{color:var(--red);margin-left:2px}
.form-input{width:100%;padding:12px 16px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:var(--r-md);color:var(--wh);font-size:.95rem;font-family:var(--sans);outline:none}
.form-input::placeholder{color:#4a5568}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.form-submit{width:100%;padding:16px;background:linear-gradient(135deg,var(--g5),var(--g6));color:var(--n9);font-weight:700;font-size:1rem;border:none;border-radius:var(--r-full);cursor:pointer;font-family:var(--sans)}
.form-note{text-align:center;font-size:.75rem;color:#4a5568;margin-top:12px}
.form-error-msg{display:none;font-size:.78rem;color:var(--red);margin-top:5px}
.hero-form-card{background:var(--n8);border:1px solid rgba(255,255,255,.1);border-radius:var(--r-lg);padding:32px}
.hero-form-card h3{font-size:1.2rem;font-weight:700;margin-bottom:6px;color:var(--wh)}
@media(max-width:768px){.nav-links{display:none!important}.nav-cta{display:none!important}.nav-hamburger{display:flex!important;flex-direction:column;gap:5px;cursor:pointer;padding:8px;background:none;border:none}.nav-hamburger span{display:block;width:22px;height:2px;background:#fff;border-radius:2px}.grid-3{grid-template-columns:1fr}.form-row{grid-template-columns:1fr}}
.nav-mobile{display:none;position:fixed;top:72px;left:0;right:0;bottom:0;background:#060c1e;z-index:1001;padding:24px;overflow-y:auto;flex-direction:column;gap:8px}
.nav-mobile.open{display:flex}
.nav-mobile a{display:block;padding:14px 16px;color:#fff;text-decoration:none;border-radius:10px;font-size:1rem;font-weight:500;border-bottom:1px solid rgba(255,255,255,.06)}
</style>
</head>
<body class="page-body" data-page="">
<style id="nav-mobile-fix">@media(max-width:768px){#th-header .nav-cta{display:none!important}}</style>

<div id="th-header">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="Talhive">
      <img src="../images/talhive-logo.png" alt="Talhive — Hiring Streamlined" width="140" height="36" fetchpriority="high" style="height:36px;width:140px;display:block">
    </a>
    <nav style="display:none" aria-hidden="true" id="nav-placeholder"></nav>
    <a href="../contact.html" class="nav-cta" style="margin-left:auto">Start a Search &#8594;</a>
  </div>
</div>

<div class="container">
  <nav class="breadcrumb"><a href="/">Home</a><span>›</span><a href="/blog/">Blog</a><span>›</span><span><?= hsc($breadLabel) ?></span></nav>
</div>

<section class="section-sm" style="padding-top:0;border-top:1px solid rgba(255,255,255,.06)">
  <div class="container">
    <p class="section-label">Related Resources</p>
    <div class="grid-3" style="margin-top:20px">
      <a href="../hire/ai-engineers.html" class="card" style="display:block;text-decoration:none;padding:20px 24px">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:9999px;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:rgba(0,229,160,.12);color:var(--green-500);margin-bottom:10px">👥 Hire</span>
        <strong style="display:block;color:#fff;font-size:.95rem;line-height:1.4">AI Engineers →</strong>
      </a>
      <a href="../solutions/technology-hiring.html" class="card" style="display:block;text-decoration:none;padding:20px 24px">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:9999px;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:rgba(0,229,160,.12);color:var(--green-500);margin-bottom:10px">⚡ Solutions</span>
        <strong style="display:block;color:#fff;font-size:.95rem;line-height:1.4">Technology Hiring →</strong>
      </a>
      <a href="../services/talent-acquisition.html" class="card" style="display:block;text-decoration:none;padding:20px 24px">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:9999px;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:rgba(41,121,255,.12);color:var(--blue-500);margin-bottom:10px">🔷 Service</span>
        <strong style="display:block;color:#fff;font-size:.95rem;line-height:1.4">Talent Acquisition →</strong>
      </a>
    </div>
  </div>
</section>

<section style="background:var(--n8);padding:64px 0 48px;border-bottom:1px solid rgba(255,255,255,.06)">
  <div class="container-sm">
    <span class="badge badge-green mb-16"><?= hsc($cat) ?></span>
    <h1 class="t-h1" style="margin:16px 0 20px"><?= hsc($title) ?></h1>
    <p class="t-body text-muted"><?= hsc($introText) ?></p>
  </div>
</section>

<section style="padding:48px 0">
  <div class="container page-with-sidebar">
    <article>
      <div style="font-size:1.05rem;line-height:1.8;color:var(--grey-200)">
        <?= $bodyHtml ?>
      </div>

      <div class="cta-band" style="margin:48px 0" data-anim="scale">
        <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:8px">Looking to Hire?</h3>
        <p style="color:var(--grey-400);margin-bottom:20px">Talhive delivers pre-vetted shortlists in 10 business days. 95% offer acceptance rate.</p>
        <a href="/contact.html" class="btn btn-primary">Start a Search →</a>
      </div>

      <?= $faqHtml ?>
    </article>

    <div class="sticky-form-wrap">
      <div class="hero-form-card">
        <h3>Need to Hire?</h3>
        <p style="font-size:.88rem;color:var(--grey-400);margin-bottom:20px">Tell us the role. We respond within 4 hours.</p>
        <form id="<?= hsc($formId) ?>" class="employer-form" action="https://api.web3forms.com/submit" method="POST" novalidate>
          <input type="hidden" name="access_key" value="e8081dd4-5636-4d2a-a4cb-b8468b260e7a">
          <input type="hidden" name="subject" value="New Hiring Brief — Talhive">
          <input type="hidden" name="from_name" value="Talhive Website">
          <input type="hidden" name="botcheck" style="display:none">
          <input type="hidden" name="Source Page" id="<?= hsc($formId) ?>-src">
          <div class="form-success" id="<?= hsc($formId) ?>-ok" style="display:none;text-align:center;padding:32px 0">
            <div style="font-size:3rem;margin-bottom:12px">✓</div>
            <h3 style="margin-bottom:8px">Brief received!</h3>
            <p style="color:var(--grey-400)">We'll respond within 4 business hours.</p>
          </div>
          <div id="<?= hsc($formId) ?>-fields">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="<?= hsc($formId) ?>-name">Your Name <span class="required">*</span></label>
                <input class="form-input" type="text" id="<?= hsc($formId) ?>-name" name="Name" placeholder="Rahul Sharma" required autocomplete="name">
                <span class="form-error-msg">Please enter your name</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="<?= hsc($formId) ?>-co">Company <span class="required">*</span></label>
                <input class="form-input" type="text" id="<?= hsc($formId) ?>-co" name="Company" placeholder="Acme Technologies" required autocomplete="organization">
                <span class="form-error-msg">Please enter your company</span>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="<?= hsc($formId) ?>-email">Business Email <span class="required">*</span></label>
                <input class="form-input" type="email" id="<?= hsc($formId) ?>-email" name="Business Email" placeholder="you@yourcompany.com" required autocomplete="email">
                <span class="form-error-msg">Use a business email</span>
              </div>
              <div class="form-group">
                <label class="form-label" for="<?= hsc($formId) ?>-phone">Phone <span class="required">*</span></label>
                <input class="form-input" type="tel" id="<?= hsc($formId) ?>-phone" name="Phone" placeholder="+91 98765 43210" required autocomplete="tel">
                <span class="form-error-msg">Please enter your phone</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="<?= hsc($formId) ?>-role">Role(s) to Hire <span class="required">*</span></label>
              <input class="form-input" type="text" id="<?= hsc($formId) ?>-role" name="Roles to Fill" placeholder="e.g. Senior AI Engineer, Head of Product" required>
              <span class="form-error-msg">Please tell us the role(s)</span>
            </div>
            <button type="submit" class="form-submit" id="<?= hsc($formId) ?>-btn">
              <span id="<?= hsc($formId) ?>-txt">Send Search Brief →</span>
              <span id="<?= hsc($formId) ?>-spin" style="display:none">⟳</span>
            </button>
            <p class="form-note">🔒 Business email required · Reply within 4 hours · No spam</p>
          </div>
        </form>
      </div>
      <div class="card" style="margin-top:24px">
        <h4 class="t-h4 mb-16">Our Numbers</h4>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div><span style="font-size:1.8rem;font-weight:800;color:var(--green-500)">270+</span><p style="font-size:.82rem;color:var(--grey-400)">Global Clients</p></div>
          <div><span style="font-size:1.8rem;font-weight:800;color:var(--green-500)">97%</span><p style="font-size:.82rem;color:var(--grey-400)">Net Promoter Score</p></div>
          <div><span style="font-size:1.8rem;font-weight:800;color:var(--green-500)">30d</span><p style="font-size:.82rem;color:var(--grey-400)">Avg. Time-to-Hire</p></div>
        </div>
      </div>
    </div>
  </div>
</section>

<div id="th-footer"></div>
<script src="../components.js" defer></script>
</body>
</html>
<?php
    return ob_get_clean();
}

// ── UPDATE SITEMAP ────────────────────────────────────────────────
function updateSitemap(string $slug, array $fm): void {
    if (!file_exists(SITEMAP)) return;
    $xml   = file_get_contents(SITEMAP);
    $url   = SITE_URL . '/blog/' . $slug . '.html';
    $today = date('Y-m-d');

    // Already in sitemap?
    if (str_contains($xml, $url)) {
        // Update lastmod
        $xml = preg_replace(
            '/(<loc>' . preg_quote($url, '/') . '<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/',
            '${1}' . $today . '${2}', $xml
        );
    } else {
        $entry = "\n  <url>\n"
               . "    <loc>{$url}</loc>\n"
               . "    <lastmod>{$today}</lastmod>\n"
               . "    <changefreq>monthly</changefreq>\n"
               . "    <priority>0.7</priority>\n"
               . "  </url>";
        $xml = str_replace('</urlset>', $entry . "\n</urlset>", $xml);
    }
    file_put_contents(SITEMAP, $xml);
}

// ── UPDATE BLOG INDEX ─────────────────────────────────────────────
function updateBlogIndex(string $slug, array $fm): void {
    if (!file_exists(BLOG_INDEX)) return;

    // Rebuild entire grid by scanning all blog files — no fragile regex insertion
    $files = glob(BLOG_DIR . '/*.html');
    $posts = [];

    foreach ($files ?: [] as $f) {
        $name = basename($f, '.html');
        if ($name === 'index') continue;
        $raw = file_get_contents($f);

        $postTitle = '';
        $postCat   = '';
        $postDesc  = '';

        if (preg_match('/<title>([^<]+)<\/title>/i', $raw, $m))
            $postTitle = trim(preg_replace('/\s*\|\s*Talhive.*$/i', '', $m[1]));
        if (preg_match('/<span[^>]*badge-green[^>]*>([^<]+)<\/span>/i', $raw, $m))
            $postCat = trim(strip_tags($m[1]));
        if (preg_match('/<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']/i', $raw, $m))
            $postDesc = trim($m[1]);

        $posts[] = [
            'slug'  => $name,
            'title' => $postTitle ?: $name,
            'cat'   => $postCat  ?: 'Recruitment',
            'desc'  => $postDesc,
            'mtime' => filemtime($f),
        ];
    }

    usort($posts, fn($a, $b) => $b['mtime'] - $a['mtime']);

    if (empty($posts)) {
        $cardsHtml = '<div class="empty-state"><div style="font-size:2.5rem">&#128221;</div><p>No posts yet. Upload your first .md file in the admin.</p></div>' . "\n";
    } else {
        $cardsHtml = '';
        foreach ($posts as $p) {
            $href    = '/blog/' . $p['slug'] . '.html';
            $t       = htmlspecialchars($p['title'], ENT_QUOTES, 'UTF-8');
            $c       = htmlspecialchars($p['cat'],   ENT_QUOTES, 'UTF-8');
            $excerpt = $p['desc'] ? htmlspecialchars(mb_substr($p['desc'], 0, 115), ENT_QUOTES, 'UTF-8') . '&hellip;' : '';

            $cardsHtml .= '<a href="' . $href . '" class="card" style="display:block;text-decoration:none">' . "\n"
                       .  '  <span class="badge badge-green" style="margin-bottom:12px">' . $c . '</span>' . "\n"
                       .  '  <h3 style="font-size:1.05rem;font-weight:700;color:var(--white);margin:8px 0 12px;line-height:1.45">' . $t . '</h3>' . "\n"
                       .  '  <p style="font-size:.88rem;color:var(--grey-400);line-height:1.65">' . $excerpt . '</p>' . "\n"
                       .  '  <div style="color:var(--green-500);font-size:.88rem;font-weight:600;margin-top:16px">Read more &rarr;</div>' . "\n"
                       .  '</a>' . "\n";
        }
    }

    $page = file_get_contents(BLOG_INDEX);
    $page = preg_replace(
        '/<!-- BLOG-CARDS-START -->.*?<!-- BLOG-CARDS-END -->/s',
        '<!-- BLOG-CARDS-START -->' . "\n" . $cardsHtml . '<!-- BLOG-CARDS-END -->',
        $page
    );
    file_put_contents(BLOG_INDEX, $page);
}

// ── GET EXISTING POSTS ────────────────────────────────────────────
function getExistingPosts(): array {
    $files = glob(BLOG_DIR . '/*.html');
    if (!$files) return [];
    $posts = [];
    foreach ($files as $f) {
        $name = basename($f, '.html');
        if ($name === 'index') continue;
        $html  = file_get_contents($f);
        $title = '';
        $cat   = '';
        if (preg_match('/<title>([^<]+)<\/title>/', $html, $m)) $title = trim(preg_replace('/\s*\|\s*Talhive.*$/i', '', $m[1]));
        if (preg_match('/badge-green[^>]*>([^<]+)</', $html, $m))  $cat = trim($m[1]);
        $mtime = filemtime($f);
        $posts[] = ['slug' => $name, 'title' => $title ?: $name, 'cat' => $cat ?: '—', 'date' => date('d M Y', $mtime)];
    }
    usort($posts, fn($a,$b) => strcmp($b['slug'], $a['slug']));
    return $posts;
}

// ── RENDER ADMIN UI ───────────────────────────────────────────────
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Talhive Blog Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#060c1e;--surface:#0a1328;--surface2:#0d1a38;
  --green:#00e5a0;--green2:#00b87d;--blue:#2979ff;
  --text:#e2e8f0;--muted:#8892b0;--border:rgba(255,255,255,.08);
  --red:#ff4d6d;--r:12px;--nav:64px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
a{color:var(--green);text-decoration:none}
/* ── Layout ── */
.app{display:grid;grid-template-rows:var(--nav) 1fr;min-height:100vh}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50}
.topbar-logo{display:flex;align-items:center;gap:10px;font-size:1.15rem;font-weight:700;letter-spacing:-.02em}
.topbar-logo span{color:var(--green)}
.topbar-right{display:flex;align-items:center;gap:16px;font-size:.83rem}
.badge-admin{background:rgba(0,229,160,.12);color:var(--green);border:1px solid rgba(0,229,160,.25);padding:3px 10px;border-radius:99px;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.content{max-width:1100px;margin:0 auto;padding:36px 28px;width:100%}
/* ── Cards ── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:28px}
.card-title{font-size:1rem;font-weight:700;margin-bottom:4px}
.card-sub{font-size:.82rem;color:var(--muted);margin-bottom:24px}
/* ── Grid ── */
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px}
@media(max-width:768px){.grid2{grid-template-columns:1fr}}
/* ── Upload box ── */
.upload-zone{border:2px dashed rgba(0,229,160,.3);border-radius:var(--r);padding:36px 24px;text-align:center;cursor:pointer;transition:all .2s;background:rgba(0,229,160,.03);position:relative}
.upload-zone:hover,.upload-zone.drag{border-color:var(--green);background:rgba(0,229,160,.07)}
.upload-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.upload-icon{font-size:2.2rem;margin-bottom:10px}
.upload-zone p{font-size:.88rem;color:var(--muted);margin-top:6px}
.upload-zone strong{color:var(--text)}
#file-name{font-size:.82rem;color:var(--green);margin-top:8px;font-weight:600}
/* ── Form ── */
.field{margin-bottom:16px}
.field label{display:block;font-size:.8rem;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em}
.field input,.field select{width:100%;padding:10px 14px;background:rgba(255,255,255,.05);border:1.5px solid var(--border);border-radius:8px;color:var(--text);font-size:.9rem;font-family:inherit;outline:none;transition:border .15s}
.field input:focus,.field select:focus{border-color:rgba(0,229,160,.5)}
.field select option{background:#0a1328}
.checkbox-row{display:flex;align-items:center;gap:8px;font-size:.85rem;color:var(--muted);margin-bottom:20px}
.checkbox-row input{width:16px;height:16px;accent-color:var(--green)}
/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:99px;font-weight:600;font-size:.9rem;cursor:pointer;border:none;font-family:inherit;transition:all .2s}
.btn-green{background:linear-gradient(135deg,var(--green),var(--green2));color:#060c1e}
.btn-green:hover{opacity:.9;transform:translateY(-1px)}
.btn-outline{background:transparent;color:var(--muted);border:1px solid var(--border)}
.btn-outline:hover{color:var(--text);border-color:rgba(255,255,255,.2)}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none!important}
/* ── Alerts ── */
.alert{padding:14px 18px;border-radius:8px;font-size:.88rem;margin-bottom:24px;display:flex;align-items:flex-start;gap:10px}
.alert-success{background:rgba(0,229,160,.1);border:1px solid rgba(0,229,160,.25);color:#6ee7c0}
.alert-error{background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.25);color:#fca5b5}
/* ── Table ── */
.posts-table{width:100%;border-collapse:collapse;font-size:.85rem}
.posts-table th{text-align:left;padding:10px 14px;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border)}
.posts-table td{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
.posts-table tr:last-child td{border-bottom:none}
.posts-table tr:hover td{background:rgba(255,255,255,.02)}
.slug-code{font-family:monospace;font-size:.8rem;color:var(--muted)}
.cat-pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:.72rem;font-weight:600;background:rgba(0,229,160,.12);color:var(--green);white-space:nowrap}
.section-head{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.section-head::before{content:"";display:block;width:16px;height:2px;background:var(--green);border-radius:2px}
/* ── Login ── */
.login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg)}
.login-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:48px 40px;width:100%;max-width:400px;text-align:center}
.login-logo{font-size:1.6rem;font-weight:800;margin-bottom:8px}
.login-logo span{color:var(--green)}
.login-sub{font-size:.88rem;color:var(--muted);margin-bottom:32px}
.login-input{width:100%;padding:13px 16px;background:rgba(255,255,255,.05);border:1.5px solid var(--border);border-radius:8px;color:var(--text);font-size:1rem;font-family:inherit;outline:none;margin-bottom:16px;text-align:center}
.login-input:focus{border-color:rgba(0,229,160,.5)}
.login-btn{width:100%;padding:14px;background:linear-gradient(135deg,var(--green),var(--green2));color:#060c1e;font-weight:700;font-size:1rem;border:none;border-radius:99px;cursor:pointer;font-family:inherit}
/* ── Tip box ── */
.tip{background:rgba(41,121,255,.08);border:1px solid rgba(41,121,255,.2);border-radius:8px;padding:14px 16px;font-size:.82rem;color:#93c5fd;line-height:1.6}
.tip code{background:rgba(255,255,255,.1);padding:1px 5px;border-radius:3px;font-family:monospace}
/* ── Spinner ── */
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(6,12,30,.4);border-top-color:#060c1e;border-radius:50%;animation:spin .6s linear infinite}
/* ── Result card ── */
.result-card{background:rgba(0,229,160,.06);border:1px solid rgba(0,229,160,.2);border-radius:var(--r);padding:20px 24px;margin-top:20px}
.result-card h4{font-size:.9rem;font-weight:700;color:var(--green);margin-bottom:8px}
.result-card p{font-size:.83rem;color:var(--muted);line-height:1.6}
.result-card a{color:var(--green);font-weight:600}
</style>
</head>
<body>

<?php if (!$auth): ?>
<!-- ── LOGIN SCREEN ── -->
<div class="login-wrap">
  <div class="login-box">
    <div class="login-logo">Tal<span>hive</span></div>
    <div class="login-sub">Blog Admin Dashboard</div>
    <?php if (isset($error)): ?>
      <div class="alert alert-error" style="margin-bottom:20px;text-align:left">⚠ <?= hsc($error) ?></div>
    <?php endif ?>
    <form method="POST">
      <input type="password" name="pw" class="login-input" placeholder="Enter password" autofocus required>
      <button type="submit" class="login-btn">Sign In →</button>
    </form>
  </div>
</div>

<?php else: ?>
<!-- ── DASHBOARD ── -->
<div class="app">
  <header class="topbar">
    <div class="topbar-logo">Tal<span>hive</span> <span class="badge-admin">Admin</span></div>
    <div class="topbar-right">
      <a href="<?= SITE_URL ?>/blog/" target="_blank" class="btn btn-outline" style="padding:7px 14px;font-size:.8rem">View Blog →</a>
      <a href="?logout" class="btn btn-outline" style="padding:7px 14px;font-size:.8rem">Logout</a>
    </div>
  </header>

  <main class="content">

    <?php if ($error): ?>
    <div class="alert alert-error">⚠&nbsp; <?= $error ?></div>
    <?php endif ?>

    <?php if ($success): ?>
    <div class="alert alert-success">✓&nbsp; <?= $success ?></div>
    <?php if ($generated): ?>
    <div class="result-card">
      <h4>✅ Post Published</h4>
      <p><strong>Slug:</strong> <code class="slug-code"><?= hsc($generated['slug']) ?>.html</code></p>
      <p><strong>Title:</strong> <?= hsc($generated['title']) ?></p>
      <p><strong>Category:</strong> <?= hsc($generated['category']) ?></p>
      <p style="margin-top:10px">
        <a href="<?= SITE_URL ?>/blog/<?= hsc($generated['slug']) ?>.html" target="_blank">View post live →</a>
        &nbsp;·&nbsp;
        <a href="<?= SITE_URL ?>/sitemap.xml" target="_blank">View sitemap →</a>
      </p>
    </div>
    <?php endif ?>
    <?php endif ?>

    <div class="grid2">
      <!-- ── UPLOAD CARD ── -->
      <div class="card">
        <div class="card-title">📝 Publish New Blog Post</div>
        <div class="card-sub">Upload a .md file — it's converted to a live blog post instantly.</div>

        <form method="POST" enctype="multipart/form-data" id="upload-form">
          <div class="upload-zone" id="drop-zone">
            <input type="file" name="mdfile" id="md-input" accept=".md" required>
            <div class="upload-icon">📄</div>
            <strong>Click to choose .md file</strong>
            <p>or drag & drop here</p>
            <div id="file-name"></div>
          </div>

          <div style="margin-top:16px" class="tip">
            <strong>Optional frontmatter</strong> — add at the top of your .md file:<br>
            <code>---</code><br>
            <code>title: Your Post Title</code><br>
            <code>category: AI &amp; Recruitment</code><br>
            <code>description: 150 char SEO meta</code><br>
            <code>keywords: keyword one, keyword two</code><br>
            <code>---</code>
          </div>

          <div style="margin-top:16px" class="checkbox-row">
            <input type="checkbox" name="overwrite" id="overwrite" value="1">
            <label for="overwrite">Overwrite if slug already exists</label>
          </div>

          <button type="submit" class="btn btn-green" id="submit-btn" style="width:100%;justify-content:center">
            <span id="btn-text">Publish Post →</span>
            <span id="btn-spin" style="display:none"><span class="spinner"></span>&nbsp;Publishing…</span>
          </button>
        </form>
      </div>

      <!-- ── INFO CARD ── -->
      <div class="card">
        <div class="card-title">⚙️ What happens on publish</div>
        <div class="card-sub">Zero API calls. Pure PHP on your server.</div>
        <div style="display:flex;flex-direction:column;gap:14px;font-size:.88rem">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="color:var(--green);font-size:1.1rem;flex-shrink:0">①</span>
            <div><strong>Markdown parsed</strong> — headings, bold, lists, blockquotes, links, code blocks all converted to HTML</div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="color:var(--green);font-size:1.1rem;flex-shrink:0">②</span>
            <div><strong>Blog HTML generated</strong> — exact Talhive template: nav, breadcrumb, hero, sidebar hire form, FAQ accordion, CTA</div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="color:var(--green);font-size:1.1rem;flex-shrink:0">③</span>
            <div><strong>3 JSON-LD schemas</strong> — BlogPosting + Organisation + FAQPage (auto-detected from ## FAQ section)</div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="color:var(--green);font-size:1.1rem;flex-shrink:0">④</span>
            <div><strong>sitemap.xml updated</strong> — new URL added with today's lastmod</div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="color:var(--green);font-size:1.1rem;flex-shrink:0">⑤</span>
            <div><strong>blog/index.html updated</strong> — new card added to the grid with title, category, excerpt</div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="color:var(--green);font-size:1.1rem;flex-shrink:0">⑥</span>
            <div><strong>Live immediately</strong> — no rebuild, no deploy. The file is live on your cPanel server the moment you submit.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── EXISTING POSTS ── -->
    <div class="card">
      <div class="section-head">All Blog Posts</div>
      <?php $posts = getExistingPosts(); ?>
      <?php if (!$posts): ?>
        <p style="color:var(--muted);font-size:.88rem">No blog posts found in /blog/</p>
      <?php else: ?>
      <div style="overflow-x:auto">
        <table class="posts-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Category</th>
              <th>Modified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($posts as $p): ?>
            <tr>
              <td style="font-weight:600;max-width:280px"><?= hsc($p['title']) ?></td>
              <td><span class="slug-code"><?= hsc($p['slug']) ?>.html</span></td>
              <td><span class="cat-pill"><?= hsc($p['cat']) ?></span></td>
              <td style="color:var(--muted);white-space:nowrap"><?= hsc($p['date']) ?></td>
              <td style="white-space:nowrap">
                <a href="<?= SITE_URL ?>/blog/<?= hsc($p['slug']) ?>.html" target="_blank"
                   style="font-size:.8rem;color:var(--green);font-weight:600">View →</a>
              </td>
            </tr>
            <?php endforeach ?>
          </tbody>
        </table>
      </div>
      <p style="font-size:.78rem;color:var(--muted);margin-top:16px"><?= count($posts) ?> posts total</p>
      <?php endif ?>
    </div>

  </main>
</div>

<script>
// File picker label
document.getElementById('md-input').addEventListener('change', function() {
  document.getElementById('file-name').textContent = this.files[0]?.name || '';
});

// Drag and drop
const zone = document.getElementById('drop-zone');
['dragenter','dragover'].forEach(e => zone.addEventListener(e, ev => { ev.preventDefault(); zone.classList.add('drag'); }));
['dragleave','drop'].forEach(e => zone.addEventListener(e, ev => { ev.preventDefault(); zone.classList.remove('drag'); }));
zone.addEventListener('drop', ev => {
  const file = ev.dataTransfer.files[0];
  if (file) {
    const dt = new DataTransfer();
    dt.items.add(file);
    document.getElementById('md-input').files = dt.files;
    document.getElementById('file-name').textContent = file.name;
  }
});

// Spinner on submit
document.getElementById('upload-form').addEventListener('submit', function() {
  document.getElementById('btn-text').style.display = 'none';
  document.getElementById('btn-spin').style.display = 'inline-flex';
  document.getElementById('submit-btn').disabled = true;
});
</script>
<?php endif ?>
</body>
</html>
