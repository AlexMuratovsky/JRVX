from pathlib import Path
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
import stat
root=Path(__file__).resolve().parent.parent
packages=[('jrvx.ru',root/'ecosystem/reg-site.zip'),('planner.jrvx.ru',root/'planner/deploy/planner-reg.zip'),('id.jrvx.ru',root/'identity/gateway/runtime/id-reg-theme.zip')]
with ZipFile(root/'deployment/jrvx-web-release.zip','w',compression=ZIP_DEFLATED) as out:
 for prefix,package in packages:
  with ZipFile(package) as src:
   entries=[(prefix+'/',b'',True)]+[(prefix+'/'+i.filename,src.read(i),i.is_dir()) for i in src.infolist()]
   for name,data,isdir in entries:
    info=ZipInfo(name,(2026,10,20,13,0,0));info.create_system=3;info.compress_type=ZIP_DEFLATED
    info.external_attr=((stat.S_IFDIR|0o755) if isdir else (stat.S_IFREG|0o644))<<16
    if isdir:info.external_attr|=0x10
    out.writestr(info,data)
print('Prepared jrvx-web-release.zip')
