<?php
// Candidate only. HTTP transport for the existing ID/Planner Workers; no auth logic.
declare(strict_types=1);

// Leave false until fixed backend, hosting HTTPS and anonymous canary pass.
const JRVX_HTTP_BRIDGE_READY = true;
const JRVX_HTTP_UPSTREAMS = [
    'id.jrvx.ru' => 'https://id-test.jrvx.ru',
    'planner.jrvx.ru' => 'https://planner-backend.jrvx.ru',
];
const JRVX_MAX_REQUEST_BODY = 32768;
const JRVX_MAX_RESPONSE_BODY = 2097152;

function bridgeFail(int $status, string $error): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['ok' => false, 'error' => $error], JSON_UNESCAPED_SLASHES);
    exit;
}

function bridgeHost(string $host): ?string {
    $host = strtolower($host);
    if (str_ends_with($host, ':443')) $host = substr($host, 0, -4);
    return array_key_exists($host, JRVX_HTTP_UPSTREAMS) ? $host : null;
}

function bridgeURI(string $uri): ?array {
    if (strlen($uri) > 16384 || $uri === '' || $uri[0] !== '/' || preg_match('/[\x00-\x20\x7f\\\\#]/', $uri)) return null;
    $parts = explode('?', $uri, 2);
    $path = $parts[0];
    // All current routes/identifiers use ASCII without encoded path delimiters.
    if (str_contains($path, '%') || str_contains($path, '//') || preg_match('~(?:^|/)\.{1,2}(?:/|$)~', $path)) return null;
    return ['path' => $path, 'uri' => $uri];
}

function bridgeRuntimeAsset(string $host, string $path): ?string {
    if ($host !== 'id.jrvx.ru') return null;
    return ['/runtime/email-ui' => 'email-ui.js', '/runtime/admin-search' => 'admin-search.js'][$path] ?? null;
}

function bridgeRewriteHTML(string $host, string $path, string $method, int $status, array $headers, string $body): array {
    if ($host !== 'id.jrvx.ru' || $method !== 'GET' || $status !== 200 || !in_array($path, ['/', '/index.html', '/email'], true)) return [$headers, $body];
    $html = false;
    foreach ($headers as [$name, $value]) {
        if (strtolower($name) === 'content-type' && str_starts_with(strtolower($value), 'text/html')) $html = true;
        if (strtolower($name) === 'content-encoding' && strtolower(trim($value)) !== 'identity') throw new RuntimeException('unexpected_html_encoding');
    }
    if (!$html) return [$headers, $body];
    $next = str_replace(['src="/email-ui.js', 'src="/admin-search.js'], ['src="/runtime/email-ui', 'src="/runtime/admin-search'], $body);
    if ($next !== $body) $headers = array_values(array_filter($headers, static fn(array $h): bool => !in_array(strtolower($h[0]), ['etag', 'last-modified', 'content-length'], true)));
    return [$headers, $next];
}

function bridgeMethods(string $host, string $path): array {
    if (bridgeRuntimeAsset($host, $path) !== null) return ['GET'];
    if ($host === 'id.jrvx.ru') {
        $routes = [
            '/.well-known/openid-configuration' => ['GET'],
            '/.well-known/oauth-authorization-server' => ['GET'],
            '/oidc/oauth2/authorize' => ['GET'], '/oidc/login' => ['GET'],
            '/oidc/oauth2/token' => ['POST'], '/oidc/oauth2/userinfo' => ['GET'],
            '/oidc/oauth2/revoke' => ['POST'], '/oidc/jwks' => ['GET'],
            '/' => ['GET'], '/index.html' => ['GET'], '/email' => ['GET'],
            '/terms' => ['GET'], '/privacy' => ['GET'], '/favicon.ico' => ['GET'],
            '/email-ui.js' => ['GET'], '/admin-search.js' => ['GET'],
            '/api/health' => ['GET'], '/api/integrations/verify' => ['GET'],
            '/api/integrations/session' => ['GET'], '/api/auth/me' => ['GET'],
            '/api/identity/me' => ['GET'], '/api/identity/apps' => ['GET'],
            '/api/identity/admin/users' => ['GET'], '/api/admin/users' => ['GET'],
            '/api/auth/register' => ['POST'], '/api/auth/login' => ['POST'],
            '/api/auth/email/send-code' => ['POST'], '/api/auth/email/verify-code' => ['POST'],
            '/api/auth/logout' => ['POST'], '/api/profile' => ['PATCH'],
            '/api/identity/apps/link' => ['POST'], '/api/cas/state' => ['GET', 'PUT'],
        ];
        $methods = $routes[$path] ?? [];
        if (preg_match('~^/api/(?:identity/)?admin/users/[A-Za-z0-9_-]{1,128}$~D', $path)) $methods = ['PATCH', 'DELETE'];
    } elseif ($host === 'planner.jrvx.ru') {
        $routes = ['/' => ['GET'], '/index.html' => ['GET'], '/favicon.ico' => ['GET'],
            '/api/session' => ['GET'], '/api/tasks' => ['GET', 'POST'], '/api/arcade/scores' => ['GET', 'POST']];
        $methods = $routes[$path] ?? [];
        if (preg_match('~^/api/tasks/[A-Za-z0-9_-]{1,128}$~D', $path)) $methods = ['PATCH', 'DELETE'];
    } else return [];
    if ($methods && str_starts_with($path, '/api/')) $methods[] = 'OPTIONS';
    return $methods;
}

function bridgeOIDCTokenRoute(string $host, string $path): bool {
    return $host === 'id.jrvx.ru' && in_array($path, ['/oidc/oauth2/token', '/oidc/oauth2/revoke'], true);
}

function bridgeOriginAllowed(string $host, string $method, ?string $origin, string $path = ''): bool {
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) return true;
    // OAuth code/refresh exchanges and revocation authenticate their own grants.
    // Only these exact POST routes accept server requests without Origin.
    if ($method === 'POST' && bridgeOIDCTokenRoute($host, $path) && ($origin === null || $origin === '')) return true;
    // Browser mutations require Origin. Internal IDENTITY bindings never pass here.
    if ($origin === null || $origin === '') return false;
    $origins = $host === 'id.jrvx.ru'
        ? ['https://id.jrvx.ru', 'https://id-test.jrvx.ru', 'https://planner.jrvx.ru', 'https://cas.jrvx.ru']
        : ['https://planner.jrvx.ru'];
    return in_array($origin, $origins, true);
}

function bridgeRequestHeaders(array $incoming, bool $cookieFree = false): array {
    $forward = []; $bytes = 0;
    $allowed = ['accept', 'content-type', 'cookie', 'origin', 'user-agent', 'authorization', 'x-jrvx-app'];
    foreach ($incoming as $name => $value) {
        if (!is_string($value)) throw new RuntimeException('invalid_header');
        $bytes += strlen((string)$name) + strlen($value) + 4;
        if ($bytes > 32768 || strlen($value) > 16384) throw new RuntimeException('header_too_large');
        if ($cookieFree && strtolower((string)$name) === 'cookie') continue;
        if (in_array(strtolower((string)$name), $allowed, true)) {
            if (!is_string($value) || preg_match('/[\r\n\x00]/', $value)) throw new RuntimeException('invalid_header');
            $forward[] = $name . ': ' . $value;
        }
    }
    // cURL receives and forwards the original encoded bytes; never decompress twice.
    $forward[] = 'Accept-Encoding: identity';
    $forward[] = 'Expect:';
    return $forward;
}

function bridgeAppendResponseHeader(array &$state, string $line): int {
    $length = strlen($line);
    $state['bytes'] += $length;
    if ($state['bytes'] > 65536 || $length > 16384) return 0;
    if (preg_match('~^HTTP/\S+ [0-9]{3}~', $line)) { $state['headers'] = []; return $length; }
    if (trim($line) === '') return $length;
    $pair = explode(':', rtrim($line, "\r\n"), 2);
    if (count($pair) !== 2 || !preg_match('/^[!#$%&\'*+.^_`|~0-9A-Za-z-]+$/D', $pair[0])) return 0;
    if (preg_match('/[\r\n\x00]/', $pair[1])) return 0;
    $state['headers'][] = [$pair[0], ltrim($pair[1], " \t")];
    return $length;
}

function bridgeAppendResponseBody(string &$body, string $data): int {
    if (strlen($body) + strlen($data) > JRVX_MAX_RESPONSE_BODY) return 0;
    $body .= $data;
    return strlen($data);
}

function bridgeLocation(string $location, string $host): ?string {
    if (preg_match('/[\x00-\x20\x7f\\\\]/', $location)) return null;
    if (str_starts_with($location, '/') && !str_starts_with($location, '//')) return $location;
    $parts = parse_url($location);
    if (!$parts || ($parts['scheme'] ?? '') !== 'https' || isset($parts['user']) || isset($parts['pass']) || isset($parts['port'])) return null;
    $target = strtolower($parts['host'] ?? '');
    $alias = parse_url(JRVX_HTTP_UPSTREAMS[$host], PHP_URL_HOST);
    if ($target === $alias) return 'https://' . $host . ($parts['path'] ?? '/') . (isset($parts['query']) ? '?' . $parts['query'] : '') . (isset($parts['fragment']) ? '#' . $parts['fragment'] : '');
    return in_array($target, ['id.jrvx.ru', 'planner.jrvx.ru', 'cas.jrvx.ru'], true) ? $location : null;
}

function bridgeResponseHeaders(array $headers, string $host, bool $isAPI, bool $cookieFree = false): array {
    $allowed = ['content-type', 'content-encoding', 'cache-control', 'expires', 'etag', 'last-modified',
        'vary', 'location', 'set-cookie', 'retry-after', 'content-security-policy',
        'strict-transport-security', 'x-content-type-options', 'x-frame-options',
        'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy',
        'cross-origin-resource-policy', 'cross-origin-embedder-policy',
        'access-control-allow-origin', 'access-control-allow-credentials',
        'access-control-allow-methods', 'access-control-allow-headers', 'allow', 'x-jrvx-identity-worker'];
    $connectionTokens = [];
    foreach ($headers as [$name, $value]) if (strtolower($name) === 'connection') {
        foreach (explode(',', strtolower($value)) as $token) $connectionTokens[] = trim($token);
    }
    $out = []; $cookie = false;
    foreach ($headers as [$name, $value]) {
        $lower = strtolower($name);
        if (!in_array($lower, $allowed, true) || in_array($lower, $connectionTokens, true)) continue;
        if (preg_match('/[\r\n\x00]/', $value)) throw new RuntimeException('invalid_response_header');
        if ($lower === 'location') { $value = bridgeLocation($value, $host); if ($value === null) throw new RuntimeException('invalid_redirect'); }
        if ($cookieFree && $lower === 'set-cookie') continue;
        if ($lower === 'set-cookie') $cookie = true;
        $out[] = [$name, $value];
    }
    if ($isAPI || $cookie) {
        $out = array_values(array_filter($out, static fn(array $h): bool => !in_array(strtolower($h[0]), ['cache-control', 'expires', 'etag', 'last-modified'], true)));
        $out[] = ['Cache-Control', 'no-store'];
    }
    return $out;
}

function bridgeTransportFailure(bool $mutation, bool $timeout): array {
    return ['status' => $timeout ? 504 : 502, 'body' => [
        'ok' => false, 'error' => $timeout ? 'gateway_timeout' : 'gateway_unavailable',
        'message' => $mutation
            ? 'Связь прервалась. Результат операции неизвестен. Обновите страницу и проверьте результат перед повтором.'
            : 'Сервис не ответил. Повторите проверку соединения.',
    ]];
}

function bridgeRun(): void {
    ini_set('display_errors', '0');
    ini_set('zlib.output_compression', '0');
    $host = bridgeHost((string)($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === null) bridgeFail(421, 'unknown_host');
    $uri = bridgeURI((string)($_SERVER['REQUEST_URI'] ?? ''));
    if ($uri === null) bridgeFail(400, 'invalid_path');
    $methods = bridgeMethods($host, $uri['path']);
    if (!$methods) bridgeFail(404, 'not_found');
    $method = (string)($_SERVER['REQUEST_METHOD'] ?? '');
    if (!in_array($method, $methods, true)) { header('Allow: ' . implode(', ', $methods)); bridgeFail(405, 'method_not_allowed'); }
    if (!bridgeOriginAllowed($host, $method, $_SERVER['HTTP_ORIGIN'] ?? null, $uri['path'])) bridgeFail(403, 'invalid_origin');
    // Only provider-owned HTTPS state is trusted; client X-Forwarded-Proto is ignored.
    if (($_SERVER['HTTPS'] ?? '') !== 'on' && (string)($_SERVER['SERVER_PORT'] ?? '') !== '443') bridgeFail(400, 'https_required');
    if (!JRVX_HTTP_BRIDGE_READY) bridgeFail(503, 'gateway_not_configured');
    $runtimeAsset = bridgeRuntimeAsset($host, $uri['path']);
    if ($runtimeAsset !== null) {
        // Fixed public source files, served through PHP to avoid HTML interstitials
        // being returned for .js requests by the provider's static-file layer.
        $script = @file_get_contents(__DIR__ . '/' . $runtimeAsset);
        if ($script === false || strlen($script) > 65536) bridgeFail(503, 'runtime_unavailable');
        header('Content-Type: application/javascript; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: public, max-age=3600');
        echo $script; return;
    }
    if (!extension_loaded('curl')) bridgeFail(503, 'gateway_unavailable');
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > JRVX_MAX_REQUEST_BODY) bridgeFail(413, 'body_too_large');
    $stream = fopen('php://input', 'rb');
    if ($stream === false) bridgeFail(400, 'invalid_body');
    $body = stream_get_contents($stream, JRVX_MAX_REQUEST_BODY + 1); fclose($stream);
    if ($body === false) bridgeFail(400, 'invalid_body');
    if (strlen($body) > JRVX_MAX_REQUEST_BODY) bridgeFail(413, 'body_too_large');
    if (in_array($method, ['GET', 'OPTIONS'], true) && $body !== '') bridgeFail(400, 'unexpected_body');
    try { $requestHeaders = bridgeRequestHeaders(getallheaders(), bridgeOIDCTokenRoute($host, $uri['path'])); } catch (Throwable $e) { bridgeFail(400, 'invalid_header'); }
    $headerState = ['headers' => [], 'bytes' => 0]; $responseBody = '';
    $ch = curl_init(JRVX_HTTP_UPSTREAMS[$host] . $uri['uri']);
    $configured = curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $requestHeaders,
        CURLOPT_FOLLOWLOCATION => false, CURLOPT_MAXREDIRS => 0,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT => 3, CURLOPT_TIMEOUT => $method === 'GET' ? 8 : 12,
        CURLOPT_HTTP_CONTENT_DECODING => false, CURLOPT_RETURNTRANSFER => false,
        CURLOPT_HEADERFUNCTION => static function ($ch, string $line) use (&$headerState): int {
            return bridgeAppendResponseHeader($headerState, $line);
        },
        CURLOPT_WRITEFUNCTION => static function ($ch, string $data) use (&$responseBody): int {
            return bridgeAppendResponseBody($responseBody, $data);
        },
    ]);
    if (!$configured) { curl_close($ch); bridgeFail(502, 'gateway_unavailable'); }
    if (!in_array($method, ['GET', 'OPTIONS'], true) && !curl_setopt($ch, CURLOPT_POSTFIELDS, $body)) { curl_close($ch); bridgeFail(502, 'gateway_unavailable'); }
    // Exactly one upstream attempt. A timeout never means an auth mutation was undone.
    $ok = curl_exec($ch); $error = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    try {
        if ($ok === false || $status < 200 || $status > 599) throw new RuntimeException('transport_failure');
        [$headerState['headers'], $responseBody] = bridgeRewriteHTML($host, $uri['path'], $method, $status, $headerState['headers'], $responseBody);
        $out = bridgeResponseHeaders($headerState['headers'], $host, str_starts_with($uri['path'], '/api/') || str_starts_with($uri['path'], '/oidc/'), bridgeOIDCTokenRoute($host, $uri['path']));
        http_response_code($status);
        foreach ($out as [$name, $value]) header($name . ': ' . $value, false);
        echo $responseBody;
    } catch (Throwable $e) {
        $failure = bridgeTransportFailure(!in_array($method, ['GET', 'OPTIONS'], true), $error === CURLE_OPERATION_TIMEDOUT);
        http_response_code($failure['status']);
        header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
        echo json_encode($failure['body'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

// CLI fixtures include this file without network requests. Web entry is fail-closed.
if (PHP_SAPI !== 'cli') bridgeRun();
