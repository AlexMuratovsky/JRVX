from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import stat
root=Path(__file__).resolve().parent
with ZipFile(root/'reg-site.zip','w',compression=ZIP_DEFLATED) as archive:
    for item in sorted((root/'static').rglob('*')):
        entry=ZipInfo(item.relative_to(root/'static').as_posix()+('/' if item.is_dir() else ''),(2026,10,20,12,0,0))
        entry.create_system=3
        entry.compress_type=ZIP_DEFLATED
        entry.external_attr=((stat.S_IFDIR|0o755) if item.is_dir() else (stat.S_IFREG|0o644))<<16
        if item.is_dir(): entry.external_attr|=0x10
        archive.writestr(entry,b'' if item.is_dir() else item.read_bytes())
print('Created reg-site.zip with files 0644 and directories 0755')
