<?php
declare(strict_types=1);
require __DIR__ . '/../../gateway/index.php';
if (PHP_VERSION_ID < 80300) throw new RuntimeException('PHP 8.3 or later is required');
$input = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$out = [];
foreach ($input as $item) {
    try {
        $out[] = match ($item['op']) {
            'methods' => bridgeMethods($item['host'] ?? 'id.jrvx.ru', $item['path']),
            'host' => bridgeHost($item['value']),
            'uri' => bridgeURI($item['value']),
            'config' => bridgeValidateConfig($item['value']),
            'origin' => bridgeOriginAllowed('id.jrvx.ru', $item['method'], $item['origin'] ?? null, $item['path']),
            'request' => bridgeRequestHeaders($item['headers'], $item['ip'], $item['secret'], $item['cookieFree'] ?? false),
            'response' => bridgeResponseHeaders($item['headers'], 'id.jrvx.ru', $item['upstream'], $item['api'] ?? false, $item['cookieFree'] ?? false),
            'location' => bridgeLocation($item['value'], 'id.jrvx.ru', $item['upstream']),
            'limit' => bridgeBodyLimit($item['path']),
            'failure' => bridgeTransportFailure($item['mutation'], $item['timeout']),
            default => throw new RuntimeException('unknown_fixture'),
        };
    } catch (Throwable $error) { $out[] = ['error' => $error->getMessage()]; }
}
echo json_encode($out, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
