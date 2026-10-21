<?php
declare(strict_types=1);
// Transport only. Authentication, ownership and mutations stay in the Worker.
const PLANNER_UPSTREAM = 'https://planner-full-backend.jrvx.ru';
const PLANNER_PUBLIC = 'https://planner.jrvx.ru';
const PLANNER_MAX_BODY = 10485760;
function plannerFail(int $status): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['error'=>'Сервис временно недоступен. Повторите попытку.'], JSON_UNESCAPED_UNICODE);
    exit;
}
$host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
if (!in_array($host, ['planner.jrvx.ru', 'planner.jrvx.ru:443'], true)) plannerFail(400);
$uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
if ($uri === '' || strlen($uri)>32768 || $uri[0]!=='/' || str_starts_with($uri,'//') || preg_match('/[\x00-\x20\x7f\\\\#]/',$uri)) plannerFail(400);
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($method,['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'],true)) plannerFail(405);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0)>PLANNER_MAX_BODY) plannerFail(413);
$body = '';
if (!in_array($method,['GET','HEAD'],true)) {
    $input=fopen('php://input','rb');
    if (!$input) plannerFail(400);
    $body=stream_get_contents($input,PLANNER_MAX_BODY+1);fclose($input);
    if ($body===false || strlen($body)>PLANNER_MAX_BODY) plannerFail(413);
}
$allowed=['accept','accept-language','content-type','cookie','origin','user-agent','authorization','sec-fetch-site','sec-fetch-mode','sec-fetch-dest','rsc','next-router-state-tree','next-router-prefetch','next-url','last-event-id'];
$headers=['Accept-Encoding: identity'];
foreach(getallheaders() as $name=>$value){
    $name=strtolower((string)$name);$value=(string)$value;
    if (!in_array($name,$allowed,true)) continue;
    if (preg_match('/[\r\n\x00]/',$value)||strlen($value)>32768) plannerFail(400);
    $headers[]=$name.': '.$value;
}
$state=['status'=>502,'headers'=>[],'sent'=>false,'bytes'=>0];
$sendHeaders=static function()use(&$state):void{
    if($state['sent'])return;$state['sent']=true;
    http_response_code($state['status']);
    $allow=['content-type','content-encoding','content-disposition','location','set-cookie','vary','retry-after','www-authenticate','content-security-policy','permissions-policy'];
    foreach($state['headers'] as [$name,$value]){
        $lower=strtolower($name);if(!in_array($lower,$allow,true))continue;
        if($lower==='location'&&str_starts_with($value,PLANNER_UPSTREAM.'/'))$value=PLANNER_PUBLIC.substr($value,strlen(PLANNER_UPSTREAM));
        if($lower==='set-cookie')$value=preg_replace('/;\s*Domain=\.?planner-full-backend\.jrvx\.ru/i','',$value);
        header($name.': '.$value,false);
    }
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Accel-Buffering: no');
};
$ch=curl_init(PLANNER_UPSTREAM.$uri);
curl_setopt_array($ch,[
    CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$headers,
    CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>90,
    CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,
    CURLOPT_HEADERFUNCTION=>static function($handle,string $line)use(&$state):int{
        $len=strlen($line);$line=trim($line);
        if(preg_match('~^HTTP/\S+\s+(\d{3})~',$line,$m)){$state['status']=(int)$m[1];$state['headers']=[];}
        elseif(str_contains($line,':')){[$n,$v]=explode(':',$line,2);$state['headers'][]=[trim($n),trim($v)];}
        return $len;
    },
    CURLOPT_WRITEFUNCTION=>static function($handle,string $data)use(&$state,$sendHeaders):int{
        $length=strlen($data);$state['bytes']+=$length;
        if($state['bytes']>16777216)return 0;
        $sendHeaders();echo $data;if(ob_get_level()>0)@ob_flush();flush();return $length;
    }
]);
if(!in_array($method,['GET','HEAD'],true))curl_setopt($ch,CURLOPT_POSTFIELDS,$body);
if($method==='HEAD')curl_setopt($ch,CURLOPT_NOBODY,true);
$ok=curl_exec($ch);curl_close($ch);
if($ok===false&&!$state['sent'])plannerFail(502);
$sendHeaders();
